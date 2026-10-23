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

    const habit = await prisma.habit.findFirst({
      where: { id, userId: user.id },
    });
    if (!habit) return NextResponse.json({ error: "Habit not found" }, { status: 404 });

    // Check if log already exists for this date
    const existingLog = await prisma.habitLog.findUnique({
      where: {
        habitId_date: {
          habitId: id,
          date,
        },
      },
    });

    if (existingLog) {
      // Toggle off -> delete
      await prisma.habitLog.delete({
        where: { id: existingLog.id },
      });
      return NextResponse.json({ completed: false, date });
    } else {
      // Toggle on -> create
      const newLog = await prisma.habitLog.create({
        data: {
          habitId: id,
          date,
          completed: true,
        },
      });
      return NextResponse.json({ completed: true, date, log: newLog });
    }
  } catch (err: any) {
    console.error("Habit check error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
