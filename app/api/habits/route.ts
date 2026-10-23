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

    const today = getTodayISO();
    const fourteenDaysAgo = addDays(today, -14);

    const habits = await prisma.habit.findMany({
      where: { userId: user.id },
      orderBy: { order: "asc" },
      include: {
        logs: {
          where: {
            date: { gte: fourteenDaysAgo },
          },
          orderBy: { date: "desc" },
        },
      },
    });

    // Compute streak for each habit
    const habitsWithStreaks = habits.map((habit) => {
      let streak = 0;
      let checkDate = today;

      // If today is completed, streak starts at 1, else check if yesterday was completed
      const todayLog = habit.logs.find((l) => l.date === today && l.completed);
      const yesterdayLog = habit.logs.find((l) => l.date === addDays(today, -1) && l.completed);

      if (todayLog) {
        streak = 1;
        checkDate = addDays(today, -1);
      } else if (yesterdayLog) {
        streak = 0; // hasn't checked in today yet, but streak is active from yesterday
        checkDate = addDays(today, -1);
      } else {
        checkDate = "";
      }

      if (checkDate) {
        while (true) {
          const log = habit.logs.find((l) => l.date === checkDate && l.completed);
          if (log) {
            if (checkDate !== today) streak++;
            checkDate = addDays(checkDate, -1);
          } else {
            break;
          }
        }
      }

      return {
        ...habit,
        streak,
        isCompletedToday: Boolean(todayLog),
      };
    });

    return NextResponse.json({ habits: habitsWithStreaks });
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
    const { title, icon, color, frequency, targetDays } = body;

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
        order: nextOrder,
      },
      include: {
        logs: true,
      },
    });

    return NextResponse.json({ habit }, { status: 201 });
  } catch (err: any) {
    console.error("Failed to create habit:", err);
    return NextResponse.json({ error: err.message || "Failed to create habit" }, { status: 500 });
  }
}
