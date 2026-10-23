import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { taskIds, action, value } = body;

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return NextResponse.json({ error: "taskIds must be a non-empty array" }, { status: 400 });
    }

    const where = {
      id: { in: taskIds },
      userId: user.id,
    };

    if (action === "complete") {
      const completed = Boolean(value);
      await prisma.task.updateMany({
        where,
        data: {
          completed,
          completedAt: completed ? new Date() : null,
          kanbanStatus: completed ? "DONE" : "TODO",
        },
      });
      return NextResponse.json({ success: true, count: taskIds.length });
    }

    if (action === "delete") {
      const permanent = Boolean(value?.permanent);
      if (permanent) {
        await prisma.task.deleteMany({ where });
      } else {
        await prisma.task.updateMany({
          where,
          data: { isTrash: true },
        });
      }
      return NextResponse.json({ success: true, count: taskIds.length });
    }

    if (action === "priority") {
      const priority = Number(value) || 0;
      await prisma.task.updateMany({
        where,
        data: { priority },
      });
      return NextResponse.json({ success: true, count: taskIds.length });
    }

    if (action === "dueDate") {
      await prisma.task.updateMany({
        where,
        data: { dueDate: value || null },
      });
      return NextResponse.json({ success: true, count: taskIds.length });
    }

    if (action === "moveList") {
      const listId = value === "inbox" ? null : value;
      await prisma.task.updateMany({
        where,
        data: { listId },
      });
      return NextResponse.json({ success: true, count: taskIds.length });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
