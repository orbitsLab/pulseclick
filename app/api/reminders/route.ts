import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get("taskId");

    const reminders = await prisma.reminder.findMany({
      where: {
        task: { userId: user.id, ...(taskId ? { id: taskId } : {}) },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ reminders });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { taskId, type, remindAt, minutesBefore } = body;

    if (!taskId) {
      return NextResponse.json({ error: "taskId is required" }, { status: 400 });
    }

    const task = await prisma.task.findFirst({
      where: { id: taskId, userId: user.id },
    });
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const reminder = await prisma.reminder.create({
      data: {
        taskId,
        type: type || "AT_TIME",
        remindAt: remindAt || null,
        minutesBefore: minutesBefore === undefined ? null : Number(minutesBefore),
        enabled: true,
      },
    });

    return NextResponse.json({ reminder }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
