import { NextResponse } from "next/server";
import { getSessionAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTodayISO, addDays } from "@/lib/date-utils";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function iso(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export async function GET(req: Request) {
  try {
    const user = await getSessionAuth();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const filterHabitId = searchParams.get("habitId") || "all";

    const todayStr = getTodayISO();
    const todayDate = new Date();
    const oneYearAgoDate = new Date(todayDate);
    oneYearAgoDate.setDate(oneYearAgoDate.getDate() - 364);
    const oneYearAgoStr = iso(oneYearAgoDate);

    // Fetch all habits of user
    const habitWhere: any = { userId: user.id };
    if (filterHabitId !== "all") {
      habitWhere.id = filterHabitId;
    }

    const [allHabits, allSections, rawLogs] = await Promise.all([
      prisma.habit.findMany({
        where: habitWhere,
        orderBy: { order: "asc" },
        include: {
          section: true,
        },
      }),
      prisma.habitSection.findMany({
        where: { userId: user.id },
      }),
      prisma.habitLog.findMany({
        where: {
          habit: { userId: user.id },
          date: { gte: oneYearAgoStr },
        },
        include: {
          habit: {
            select: {
              id: true,
              title: true,
              icon: true,
              color: true,
              goalType: true,
              goalValue: true,
              goalUnit: true,
            },
          },
        },
        orderBy: { date: "desc" },
      }),
    ]);

    // Build habit lookup map
    const habitMap = new Map<string, any>();
    allHabits.forEach((h) => habitMap.set(h.id, h));

    // Group logs by date
    const logsByDate = new Map<string, any[]>();
    rawLogs.forEach((log) => {
      if (filterHabitId !== "all" && log.habitId !== filterHabitId) return;
      const list = logsByDate.get(log.date) || [];
      list.push(log);
      logsByDate.set(log.date, list);
    });

    // 1. Build 365-day Heatmap Array
    const heatmap: any[] = [];
    const cursor = new Date(oneYearAgoDate);
    const end = new Date(todayDate);

    while (cursor <= end) {
      const curIso = iso(cursor);
      const dayLogs = logsByDate.get(curIso) || [];
      const completedLogs = dayLogs.filter((l) => l.completed || l.status === "COMPLETED");
      const count = completedLogs.length;

      // Intensity level (0 to 4)
      let intensity = 0;
      if (count >= 5) intensity = 4;
      else if (count >= 3) intensity = 3;
      else if (count >= 2) intensity = 2;
      else if (count >= 1) intensity = 1;

      heatmap.push({
        date: curIso,
        count,
        intensity,
        habits: dayLogs.map((l) => ({
          id: l.habit.id,
          title: l.habit.title,
          icon: l.habit.icon,
          color: l.habit.color,
          status: l.status,
          completed: l.completed,
          value: l.value,
          unit: l.habit.goalUnit,
          note: l.note,
        })),
      });

      cursor.setDate(cursor.getDate() + 1);
    }

    // 2. Compute per-habit stats & streaks
    let totalAllTimeLogs = 0;
    let globalBestStreak = 0;
    let globalCurrentStreak = 0;
    let totalAllTimeCycles = 0;

    const perHabitStats = allHabits.map((habit) => {
      const hLogs = rawLogs.filter((l) => l.habitId === habit.id);
      const completedLogs = hLogs.filter((l) => l.completed || l.status === "COMPLETED");
      const totalLogs = completedLogs.length;
      totalAllTimeLogs += totalLogs;

      // Calculate current streak
      let streak = 0;
      let checkDate = todayStr;
      const todayLog = hLogs.find((l) => l.date === todayStr && (l.completed || l.status === "COMPLETED"));
      const isCompletedToday = Boolean(todayLog);

      const yesterday = addDays(todayStr, -1);
      const yesterdayLog = hLogs.find((l) => l.date === yesterday && (l.completed || l.status === "COMPLETED"));

      if (isCompletedToday) {
        streak = 1;
        checkDate = yesterday;
      } else if (yesterdayLog) {
        streak = 0;
        checkDate = yesterday;
      } else {
        checkDate = "";
      }

      if (checkDate) {
        while (true) {
          const l = hLogs.find((item) => item.date === checkDate);
          if (l) {
            if (l.completed || l.status === "COMPLETED") {
              if (checkDate !== todayStr) streak++;
              checkDate = addDays(checkDate, -1);
            } else if (l.status === "SKIPPED") {
              checkDate = addDays(checkDate, -1);
            } else {
              break;
            }
          } else {
            break;
          }
        }
      }

      // Best streak calculation across history
      let bestStreak = streak;
      let curRun = 0;
      // Sort ascending dates
      const sortedAsc = [...hLogs]
        .filter((l) => l.completed || l.status === "COMPLETED")
        .sort((a, b) => a.date.localeCompare(b.date));

      for (let i = 0; i < sortedAsc.length; i++) {
        if (i === 0) {
          curRun = 1;
        } else {
          const prevDate = sortedAsc[i - 1].date;
          const currDate = sortedAsc[i].date;
          if (addDays(prevDate, 1) === currDate) {
            curRun++;
          } else {
            curRun = 1;
          }
        }
        if (curRun > bestStreak) bestStreak = curRun;
      }

      if (bestStreak > globalBestStreak) globalBestStreak = bestStreak;
      if (streak > globalCurrentStreak) globalCurrentStreak = streak;

      const targetDays = habit.targetDays || (habit.frequency === "DAILY" ? 7 : 1);
      const completedCycles = Math.floor(totalLogs / Math.max(1, targetDays));
      totalAllTimeCycles += completedCycles;

      const expectedLogs = Math.max(1, Math.round(30 / 7) * targetDays);
      const completionRate = Math.min(100, Math.round((totalLogs / expectedLogs) * 100));

      return {
        id: habit.id,
        title: habit.title,
        icon: habit.icon,
        color: habit.color,
        frequency: habit.frequency,
        targetDays: habit.targetDays,
        goalType: habit.goalType,
        goalValue: habit.goalValue,
        goalUnit: habit.goalUnit,
        streak,
        bestStreak,
        totalLogs,
        completedCycles,
        completionRate,
      };
    });

    // 3. Day of week distribution (0 = Sun, 1 = Mon, ..., 6 = Sat)
    const weekdayCounts = [0, 0, 0, 0, 0, 0, 0];
    rawLogs.forEach((l) => {
      if (l.completed || l.status === "COMPLETED") {
        const d = new Date(l.date + "T12:00:00Z");
        const dayIndex = d.getUTCDay();
        weekdayCounts[dayIndex]++;
      }
    });

    const dayOfWeekDistribution = [
      { name: "Mon", count: weekdayCounts[1], dayNum: 1 },
      { name: "Tue", count: weekdayCounts[2], dayNum: 2 },
      { name: "Wed", count: weekdayCounts[3], dayNum: 3 },
      { name: "Thu", count: weekdayCounts[4], dayNum: 4 },
      { name: "Fri", count: weekdayCounts[5], dayNum: 5 },
      { name: "Sat", count: weekdayCounts[6], dayNum: 6 },
      { name: "Sun", count: weekdayCounts[0], dayNum: 0 },
    ];

    // 4. Monthly trends (last 6 months)
    const monthlyMap = new Map<string, number>();
    for (let m = 5; m >= 0; m--) {
      const d = new Date(todayDate.getFullYear(), todayDate.getMonth() - m, 1);
      const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
      monthlyMap.set(key, 0);
    }

    rawLogs.forEach((l) => {
      if (l.completed || l.status === "COMPLETED") {
        const monthKey = l.date.substring(0, 7);
        if (monthlyMap.has(monthKey)) {
          monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + 1);
        }
      }
    });

    const monthlyTrends = Array.from(monthlyMap.entries()).map(([month, count]) => {
      const [y, m] = month.split("-");
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const label = `${monthNames[Number(m) - 1]} ${y.slice(2)}`;
      return { month, label, count };
    });

    // 5. Achievement score and milestones
    const achievementScore = totalAllTimeLogs * 10 + totalAllTimeCycles * 50 + globalBestStreak * 25;

    const LEVELS = [
      { level: 1, title: "Novice Practitioner", minScore: 0, nextScore: 200 },
      { level: 2, title: "Habit Builder", minScore: 200, nextScore: 600 },
      { level: 3, title: "Consistent Achiever", minScore: 600, nextScore: 1500 },
      { level: 4, title: "Master of Routine", minScore: 1500, nextScore: 3500 },
      { level: 5, title: "Transcendent Focus", minScore: 3500, nextScore: 10000 },
    ];

    let currentLevel = LEVELS[0];
    for (const lvl of LEVELS) {
      if (achievementScore >= lvl.minScore) {
        currentLevel = lvl;
      }
    }

    const scoreInLevel = achievementScore - currentLevel.minScore;
    const levelRange = currentLevel.nextScore - currentLevel.minScore;
    const progressPct = Math.min(100, Math.round((scoreInLevel / levelRange) * 100));

    // Badges
    const badges = [
      {
        id: "first_step",
        title: "First Step",
        description: "Complete your very first habit check-in",
        category: "milestone",
        icon: "Footprints",
        unlocked: totalAllTimeLogs >= 1,
        progress: Math.min(1, totalAllTimeLogs),
        maxProgress: 1,
      },
      {
        id: "streak_7",
        title: "7-Day Momentum",
        description: "Maintain a continuous 7-day habit streak",
        category: "streak",
        icon: "Flame",
        unlocked: globalBestStreak >= 7,
        progress: Math.min(7, globalBestStreak),
        maxProgress: 7,
      },
      {
        id: "streak_21",
        title: "21-Day Habit Formed",
        description: "Forge a neurological habit routine across 21 days",
        category: "streak",
        icon: "Target",
        unlocked: globalBestStreak >= 21,
        progress: Math.min(21, globalBestStreak),
        maxProgress: 21,
      },
      {
        id: "streak_66",
        title: "Iron Will (66 Days)",
        description: "Reach full automaticity with the science-backed 66-day streak",
        category: "streak",
        icon: "Trophy",
        unlocked: globalBestStreak >= 66,
        progress: Math.min(66, globalBestStreak),
        maxProgress: 66,
      },
      {
        id: "centurion_100",
        title: "Centurion Club",
        description: "Log 100 total habit check-in sessions",
        category: "volume",
        icon: "Sparkles",
        unlocked: totalAllTimeLogs >= 100,
        progress: Math.min(100, totalAllTimeLogs),
        maxProgress: 100,
      },
      {
        id: "cycle_champion",
        title: "Cycle Champion",
        description: "Complete 5 full habit target cycles",
        category: "cycle",
        icon: "Activity",
        unlocked: totalAllTimeCycles >= 5,
        progress: Math.min(5, totalAllTimeCycles),
        maxProgress: 5,
      },
      {
        id: "weekend_warrior",
        title: "Weekend Warrior",
        description: "Keep routines going with active weekend check-ins",
        category: "consistency",
        icon: "Sun",
        unlocked: weekdayCounts[0] >= 3 && weekdayCounts[6] >= 3,
        progress: Math.min(6, weekdayCounts[0] + weekdayCounts[6]),
        maxProgress: 6,
      },
      {
        id: "multi_discipline",
        title: "Disciplined Master",
        description: "Organize and practice habits across multiple sections",
        category: "mastery",
        icon: "BookOpen",
        unlocked: allSections.length >= 2 && allHabits.length >= 3,
        progress: Math.min(3, allHabits.length),
        maxProgress: 3,
      },
    ];

    // 6. Chronological recent logs (last 50)
    const recentLogs = rawLogs.slice(0, 50).map((l) => ({
      id: l.id,
      habitId: l.habitId,
      title: l.habit.title,
      icon: l.habit.icon,
      color: l.habit.color,
      date: l.date,
      completed: l.completed,
      status: l.status,
      value: l.value,
      unit: l.habit.goalUnit,
      note: l.note,
      createdAt: l.createdAt,
    }));

    return NextResponse.json({
      heatmap,
      stats: {
        totalCheckIns: totalAllTimeLogs,
        totalCycles: totalAllTimeCycles,
        bestStreak: globalBestStreak,
        currentStreak: globalCurrentStreak,
        dayOfWeekDistribution,
        monthlyTrends,
        perHabitStats,
      },
      achievements: {
        score: achievementScore,
        level: {
          ...currentLevel,
          progressPct,
        },
        badges,
      },
      recentLogs,
    });
  } catch (err: any) {
    console.error("Failed to generate habit analytics:", err);
    return NextResponse.json({ error: err.message || "Failed to load analytics" }, { status: 500 });
  }
}
