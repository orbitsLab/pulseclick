import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTodayISO, addDays } from "@/lib/date-utils";

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status") || "ACTIVE"; // ACTIVE, ARCHIVED, ALL

    const today = getTodayISO();
    const thirtyDaysAgo = addDays(today, -30);

    const whereClause: any = { userId: user.id };
    if (statusParam !== "ALL") {
      whereClause.status = statusParam;
    }

    const [habits, sections] = await Promise.all([
      prisma.habit.findMany({
        where: whereClause,
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
        include: {
          section: true,
          logs: {
            where: {
              date: { gte: thirtyDaysAgo },
            },
            orderBy: { date: "desc" },
          },
        },
      }),
      prisma.habitSection.findMany({
        where: { userId: user.id },
        orderBy: { order: "asc" },
        include: {
          _count: {
            select: { habits: true },
          },
        },
      }),
    ]);

    // Compute streak and completedCycles for each habit
    const habitsWithStreaks = habits.map((habit) => {
      let streak = 0;
      let checkDate = today;

      const isLogDone = (log: any) => {
        if (!log) return false;
        if (log.status === "SKIPPED") return false;
        if (log.status === "MISSED") return false;
        if (habit.goalType === "NUMERIC" && habit.goalValue) {
          return (log.value ?? 0) >= habit.goalValue || log.completed;
        }
        return log.completed;
      };

      const todayLog = habit.logs.find((l) => l.date === today);
      const isCompletedToday = isLogDone(todayLog);
      const isSkippedToday = todayLog?.status === "SKIPPED";

      const yesterday = addDays(today, -1);
      const yesterdayLog = habit.logs.find((l) => l.date === yesterday);
      const yesterdayDone = isLogDone(yesterdayLog);
      const yesterdaySkipped = yesterdayLog?.status === "SKIPPED";

      if (isCompletedToday) {
        streak = 1;
        checkDate = yesterday;
      } else if (isSkippedToday || yesterdayDone || yesterdaySkipped) {
        streak = 0;
        checkDate = yesterday;
      } else {
        checkDate = "";
      }

      if (checkDate) {
        // Walk backwards
        while (true) {
          const log = habit.logs.find((l) => l.date === checkDate);
          if (log) {
            if (isLogDone(log)) {
              if (checkDate !== today) streak++;
              checkDate = addDays(checkDate, -1);
            } else if (log.status === "SKIPPED") {
              // Skipped preserves streak without adding
              checkDate = addDays(checkDate, -1);
            } else {
              break;
            }
          } else {
            break;
          }
        }
      }

      const totalCompletedLogs = habit.logs.filter((l) => isLogDone(l)).length;
      const targetDays = habit.targetDays || (habit.frequency === "DAILY" ? 7 : 1);
      const completedCycles = Math.floor(totalCompletedLogs / Math.max(1, targetDays));

      return {
        ...habit,
        streak,
        isCompletedToday,
        isSkippedToday,
        todayValue: todayLog?.value ?? null,
        todayNote: todayLog?.note ?? null,
        completedCycles,
      };
    });

    return NextResponse.json({ habits: habitsWithStreaks, sections });
  } catch (err: any) {
    console.error("Failed to load habits:", err);
    return NextResponse.json({ error: err.message || "Failed to load habits" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      icon,
      color,
      frequency,
      targetDays,
      goalType,
      goalValue,
      goalUnit,
      sectionId,
      encouragement,
      reminderTime,
      reminderEnabled,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const lastHabit = await prisma.habit.findFirst({
      where: { userId: user.id },
      orderBy: { order: "desc" },
    });
    const nextOrder = (lastHabit?.order ?? 0) + 1;

    const habit = await prisma.habit.create({
      data: {
        userId: user.id,
        title: title.trim(),
        icon: icon || "Flame",
        color: color || "#14b8a6",
        frequency: frequency || "DAILY",
        targetDays: Number(targetDays) || 1,
        goalType: goalType === "NUMERIC" ? "NUMERIC" : "BOOLEAN",
        goalValue: goalValue !== undefined && goalValue !== null ? Number(goalValue) : null,
        goalUnit: goalUnit ? String(goalUnit).trim() : null,
        sectionId: sectionId || null,
        encouragement: encouragement ? String(encouragement).trim() : null,
        reminderTime: reminderTime ? String(reminderTime).trim() : null,
        reminderEnabled: Boolean(reminderEnabled),
        status: "ACTIVE",
        order: nextOrder,
      },
      include: {
        section: true,
        logs: true,
      },
    });

    return NextResponse.json({
      habit: {
        ...habit,
        streak: 0,
        isCompletedToday: false,
        isSkippedToday: false,
        todayValue: null,
        todayNote: null,
        completedCycles: 0,
      },
    }, { status: 201 });
  } catch (err: any) {
    console.error("Failed to create habit:", err);
    return NextResponse.json({ error: err.message || "Failed to create habit" }, { status: 500 });
  }
}
