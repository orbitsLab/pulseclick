import { NextResponse } from "next/server";
import { getSessionAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Range = "week" | "month" | "quarter" | "year";

const RANGE_CONFIG: Record<Range, { days: number; bucket: "day" | "week" | "month" }> = {
  week: { days: 7, bucket: "day" },
  month: { days: 30, bucket: "day" },
  quarter: { days: 91, bucket: "week" },
  year: { days: 365, bucket: "month" },
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function iso(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function startOfDay(d: Date) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

export async function GET(req: Request) {
  try {
    const user = await getSessionAuth();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const rangeParam = (searchParams.get("range") || "month").toLowerCase();
    const range: Range = (["week", "month", "quarter", "year"] as const).includes(
      rangeParam as Range
    )
      ? (rangeParam as Range)
      : "month";

    const { days, bucket } = RANGE_CONFIG[range];
    const today = startOfDay(new Date());
    const start = new Date(today);
    start.setDate(start.getDate() - (days - 1));

    // Bucket boundaries (inclusive start, exclusive end of the range).
    const buckets: { key: string; label: string; start: Date; end: Date }[] = [];
    const cursor = new Date(start);
    while (cursor <= today) {
      const bStart = new Date(cursor);
      let bEnd: Date;
      let label: string;
      if (bucket === "day") {
        bEnd = new Date(cursor);
        bEnd.setDate(bEnd.getDate() + 1);
        label = iso(cursor);
      } else if (bucket === "week") {
        bEnd = new Date(cursor);
        bEnd.setDate(bEnd.getDate() + 7);
        label = iso(cursor);
      } else {
        bEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
        label = `${cursor.getFullYear()}-${pad(cursor.getMonth() + 1)}-01`;
      }
      buckets.push({ key: label, label, start: bStart, end: bEnd });
      cursor.setDate(cursor.getDate() + (bucket === "month" ? 28 : bucket === "week" ? 7 : 1));
      if (bucket === "month") {
        cursor.setDate(1);
        cursor.setMonth(cursor.getMonth() + 1);
        cursor.setDate(1);
        // Align to the first of the month.
        cursor.setMonth(cursor.getMonth());
      }
      if (bucket === "month") {
        const probe = new Date(bEnd);
        probe.setDate(probe.getDate() - 1);
        if (probe <= today) {
          cursor.setTime(bEnd.getTime());
          cursor.setHours(0, 0, 0, 0);
        }
      }
    }

    const bucketIndex = (d: Date) => {
      for (let i = 0; i < buckets.length; i += 1) {
        if (d >= buckets[i].start && d < buckets[i].end) return i;
      }
      return buckets.length - 1;
    };

    const [createdTasks, completedTasks, openTasks, allInRange, sessions, habits] =
      await Promise.all([
        prisma.task.findMany({
          where: { userId: user.id, createdAt: { gte: start }, isTrash: false },
          select: { id: true, createdAt: true, priority: true, listId: true },
        }),
        prisma.task.findMany({
          where: { userId: user.id, completedAt: { gte: start }, isTrash: false },
          select: { id: true, completedAt: true, priority: true, listId: true },
        }),
        prisma.task.count({
          where: { userId: user.id, completed: false, isTrash: false },
        }),
        prisma.task.findMany({
          where: { userId: user.id, isTrash: false },
          select: { id: true, listId: true, priority: true, completed: true, createdAt: true },
        }),
        prisma.pomodoroSession.findMany({
          where: { userId: user.id, completedAt: { gte: start } },
          select: { completedAt: true, durationMinutes: true },
        }),
        prisma.habit.findMany({
          where: { userId: user.id },
          include: { logs: { where: { date: { gte: iso(start) } } } },
        }),
      ]);

    const byDay = buckets.map((b) => ({ date: b.label, created: 0, completed: 0 }));
    for (const t of createdTasks) {
      const i = bucketIndex(t.createdAt);
      if (i >= 0 && i < byDay.length) byDay[i].created += 1;
    }
    for (const t of completedTasks) {
      const i = bucketIndex(t.completedAt!);
      if (i >= 0 && i < byDay.length) byDay[i].completed += 1;
    }

    const byPriorityMap = new Map<number, number>();
    for (const t of allInRange) {
      byPriorityMap.set(t.priority, (byPriorityMap.get(t.priority) ?? 0) + 1);
    }
    const byPriority = [...byPriorityMap.entries()]
      .map(([priority, count]) => ({ priority, count }))
      .sort((a, b) => b.priority - a.priority);

    const listIds = [...new Set(allInRange.map((t) => t.listId).filter(Boolean))] as string[];
    const lists = listIds.length
      ? await prisma.taskList.findMany({
          where: { userId: user.id, id: { in: listIds } },
          select: { id: true, name: true, color: true },
        })
      : [];
    const listMap = new Map(lists.map((l) => [l.id, l]));

    const byListMap = new Map<string, { name: string; color: string | null; count: number; completed: number }>();
    for (const t of allInRange) {
      const key = t.listId ?? "inbox";
      const list = t.listId ? listMap.get(t.listId) : null;
      const entry = byListMap.get(key) ?? {
        name: list?.name ?? "Inbox",
        color: list?.color ?? null,
        count: 0,
        completed: 0,
      };
      entry.count += 1;
      if (t.completed) entry.completed += 1;
      byListMap.set(key, entry);
    }
    const byList = [...byListMap.entries()].map(([listId, v]) => ({
      listId: listId === "inbox" ? null : listId,
      ...v,
    }));

    const focusByDayMap = new Map<string, number>();
    for (const s of sessions) {
      const i = bucketIndex(s.completedAt);
      if (i >= 0 && i < byDay.length) {
        const key = byDay[i].date;
        focusByDayMap.set(key, (focusByDayMap.get(key) ?? 0) + s.durationMinutes);
      }
    }

    const streaks = habits.map((h) => {
      const totalLogs = h.logs.filter((l) => l.completed).length;
      const expected = Math.max(1, Math.round(days / 7) * h.targetDays || days);
      let streak = 0;
      const probe = new Date(today);
      for (;;) {
        const key = iso(probe);
        const log = h.logs.find((l) => l.date === key && l.completed);
        if (log) {
          streak += 1;
          probe.setDate(probe.getDate() - 1);
        } else if (streak === 0 && key === iso(today)) {
          // Today not logged yet: do not break the streak, keep looking back.
          probe.setDate(probe.getDate() - 1);
        } else {
          break;
        }
      }
      return {
        title: h.title,
        color: h.color,
        streak,
        completionRate: Math.min(1, totalLogs / expected),
        totalLogs,
      };
    });

    const busiestMap = new Map<string, number>();
    for (const t of completedTasks) {
      const key = iso(t.completedAt!);
      busiestMap.set(key, (busiestMap.get(key) ?? 0) + 1);
    }
    const busiest = [...busiestMap.entries()]
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const created = createdTasks.length;
    const completed = completedTasks.length;
    const completionRate = created + completed > 0 ? completed / (created + completed) : 0;

    return NextResponse.json({
      range,
      tasks: { created, completed, open: openTasks, completionRate },
      byDay,
      byPriority,
      byList,
      focus: {
        totalMinutes: sessions.reduce((sum, s) => sum + s.durationMinutes, 0),
        sessions: sessions.length,
        byDay: byDay.map((d) => ({ date: d.date, minutes: focusByDayMap.get(d.date) ?? 0 })),
      },
      habits: {
        streaks: streaks.sort((a, b) => b.streak - a.streak),
        logs: streaks.reduce((sum, s) => sum + s.totalLogs, 0),
      },
      busiest,
    });
  } catch (err: any) {
    console.error("Failed to compute stats:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
