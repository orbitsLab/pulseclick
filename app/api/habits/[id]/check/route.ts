import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTodayISO } from "@/lib/date-utils";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const date = body.date || getTodayISO();
    const action = body.action || "toggle"; // "toggle" | "check" | "skip" | "set_value" | "uncheck"
    const value = body.value !== undefined ? (body.value === null ? null : Number(body.value)) : undefined;
    const note = body.note !== undefined ? (body.note === null ? null : String(body.note).trim()) : undefined;

    const habit = await prisma.habit.findFirst({
      where: { id, userId: user.id },
    });
    if (!habit) return NextResponse.json({ error: "Habit not found" }, { status: 404 });

    const existingLog = await prisma.habitLog.findUnique({
      where: {
        habitId_date: {
          habitId: id,
          date,
        },
      },
    });

    if (action === "uncheck") {
      if (existingLog) {
        await prisma.habitLog.delete({ where: { id: existingLog.id } });
      }
      return NextResponse.json({ completed: false, status: null, date, log: null });
    }

    if (action === "skip") {
      const log = await prisma.habitLog.upsert({
        where: {
          habitId_date: {
            habitId: id,
            date,
          },
        },
        create: {
          habitId: id,
          date,
          completed: false,
          status: "SKIPPED",
          note: note ?? null,
        },
        update: {
          completed: false,
          status: "SKIPPED",
          note: note !== undefined ? note : undefined,
        },
      });
      return NextResponse.json({ completed: false, status: "SKIPPED", date, log });
    }

    if (action === "set_value") {
      const targetVal = habit.goalValue || 1;
      const numericVal = value ?? 0;
      const isMet = numericVal >= targetVal;

      const log = await prisma.habitLog.upsert({
        where: {
          habitId_date: {
            habitId: id,
            date,
          },
        },
        create: {
          habitId: id,
          date,
          completed: isMet,
          status: isMet ? "COMPLETED" : "IN_PROGRESS",
          value: numericVal,
          note: note ?? null,
        },
        update: {
          completed: isMet,
          status: isMet ? "COMPLETED" : "IN_PROGRESS",
          value: numericVal,
          note: note !== undefined ? note : undefined,
        },
      });
      return NextResponse.json({ completed: isMet, status: log.status, date, log, value: numericVal });
    }

    // Default: toggle check
    if (existingLog) {
      if (existingLog.completed || existingLog.status === "COMPLETED") {
        // Toggle off -> delete
        await prisma.habitLog.delete({ where: { id: existingLog.id } });
        return NextResponse.json({ completed: false, status: null, date, log: null });
      } else {
        // Was SKIPPED or partial -> mark complete
        const targetVal = habit.goalType === "NUMERIC" ? (habit.goalValue || 1) : null;
        const log = await prisma.habitLog.update({
          where: { id: existingLog.id },
          data: {
            completed: true,
            status: "COMPLETED",
            value: value !== undefined ? value : (targetVal ?? existingLog.value),
            note: note !== undefined ? note : existingLog.note,
          },
        });
        return NextResponse.json({ completed: true, status: "COMPLETED", date, log });
      }
    } else {
      // Toggle on -> create complete
      const targetVal = habit.goalType === "NUMERIC" ? (value ?? habit.goalValue ?? 1) : null;
      const log = await prisma.habitLog.create({
        data: {
          habitId: id,
          date,
          completed: true,
          status: "COMPLETED",
          value: targetVal,
          note: note ?? null,
        },
      });
      return NextResponse.json({ completed: true, status: "COMPLETED", date, log });
    }
  } catch (err: any) {
    console.error("Habit check error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
