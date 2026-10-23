import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todaySessions = await prisma.pomodoroSession.findMany({
      where: {
        userId: user.id,
        completedAt: { gte: todayStart },
      },
      include: {
        task: {
          select: { id: true, title: true },
        },
      },
      orderBy: { completedAt: "desc" },
    });

    const totalMinutes = todaySessions.reduce((acc, s) => acc + s.durationMinutes, 0);
    const count = todaySessions.length;

    return NextResponse.json({
      sessions: todaySessions,
      todayTotalMinutes: totalMinutes,
      todayPomoCount: count,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { taskId, durationMinutes } = body;
    const duration = Number(durationMinutes) || 25;

    const session = await prisma.pomodoroSession.create({
      data: {
        userId: user.id,
        taskId: taskId || null,
        durationMinutes: duration,
        completedAt: new Date(),
      },
      include: { task: true },
    });

    if (taskId) {
      await prisma.task.update({
        where: { id: taskId },
        data: { pomodoroCount: { increment: 1 } },
      });
    }

    return NextResponse.json({ session }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
