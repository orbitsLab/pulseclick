import { NextResponse } from "next/server";
import { getSessionAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTodayISO } from "@/lib/date-utils";
import { computeNextOccurrence } from "@/lib/recurrence";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionAuth();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const task = await prisma.task.findFirst({
      where: { id, userId: user.id },
      relationLoadStrategy: "join",
      include: {
        list: true,
        group: true,
        subtasks: { orderBy: { order: "asc" } },
        tags: { include: { tag: true } },
      },
    });

    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
    return NextResponse.json({ task });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionAuth();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.task.findFirst({
      where: { id, userId: user.id },
      include: { subtasks: true },
    });

    if (!existing) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const updateData: any = {};
    const today = getTodayISO();

    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.description !== undefined) updateData.description = body.description;
    if (body.dueDate !== undefined) updateData.dueDate = body.dueDate;
    if (body.dueTime !== undefined) updateData.dueTime = body.dueTime;
    if (body.priority !== undefined) updateData.priority = Number(body.priority);
    if (body.recurrence !== undefined) updateData.recurrence = body.recurrence;
    if (body.recurrenceInterval !== undefined)
      updateData.recurrenceInterval = Number(body.recurrenceInterval) || 1;
    if (body.recurrenceWeekdays !== undefined)
      updateData.recurrenceWeekdays = body.recurrenceWeekdays || null;
    if (body.recurrenceEndDate !== undefined)
      updateData.recurrenceEndDate = body.recurrenceEndDate || null;
    if (body.reminder !== undefined) updateData.reminder = body.reminder;
    if (body.isPinned !== undefined) updateData.isPinned = Boolean(body.isPinned);
    if (body.isTrash !== undefined) updateData.isTrash = Boolean(body.isTrash);
    if (body.kanbanStatus !== undefined) {
      updateData.kanbanStatus = body.kanbanStatus;
      if (body.completed === undefined) {
        if (body.kanbanStatus === "DONE" || body.kanbanStatus === "WONT_DO") {
          updateData.completed = true;
          updateData.completedAt = existing.completedAt || new Date();
        } else if (
          body.kanbanStatus === "TODO" ||
          body.kanbanStatus === "IN_PROGRESS"
        ) {
          updateData.completed = false;
          updateData.completedAt = null;
        }
      }
    }
    if (body.listId !== undefined) {
      updateData.listId = body.listId === "inbox" ? null : body.listId;
      if (!updateData.listId) {
        updateData.groupId = null;
      }
    }
    if (body.groupId !== undefined) updateData.groupId = body.groupId || null;
    if (body.pomodoroCount !== undefined) updateData.pomodoroCount = Number(body.pomodoroCount);
    if (body.startDate !== undefined) updateData.startDate = body.startDate || null;
    if (body.startTime !== undefined) updateData.startTime = body.startTime || null;
    if (body.endDate !== undefined) updateData.endDate = body.endDate || null;
    if (body.endTime !== undefined) updateData.endTime = body.endTime || null;
    if (body.durationMinutes !== undefined)
      updateData.durationMinutes = Number(body.durationMinutes) || 0;
    if (body.timeZone !== undefined) updateData.timeZone = body.timeZone || null;

    // Completion & Recurring Task Auto-Advance logic
    if (body.completed !== undefined) {
      const nextCompleted = Boolean(body.completed);

      // A recurring task advances to its next occurrence instead of closing.
      if (nextCompleted && existing.recurrence && existing.recurrence !== "NONE") {
        const next = computeNextOccurrence(
          {
            recurrence: existing.recurrence,
            recurrenceInterval: existing.recurrenceInterval,
            recurrenceWeekdays: existing.recurrenceWeekdays,
            recurrenceEndDate: existing.recurrenceEndDate,
          },
          {
            dueDate: existing.dueDate,
            dueTime: existing.dueTime,
            startDate: existing.startDate,
            startTime: existing.startTime,
            endDate: existing.endDate,
            endTime: existing.endTime,
          },
          new Date()
        );

        if (next) {
          updateData.dueDate = next.dueDate;
          updateData.startDate = next.startDate;
          updateData.endDate = next.endDate;
          updateData.completed = false; // keep active for next occurrence!
          updateData.completedAt = new Date();
        } else {
          // The recurrence ended: close the task for good.
          updateData.completed = true;
          updateData.completedAt = new Date();
          updateData.kanbanStatus = body.kanbanStatus || "DONE";
        }
      } else {
        updateData.completed = nextCompleted;
        updateData.completedAt = nextCompleted ? (existing.completedAt || new Date()) : null;
        if (nextCompleted) {
          if (body.kanbanStatus !== undefined) {
            updateData.kanbanStatus = body.kanbanStatus;
          } else if (existing.kanbanStatus === "WONT_DO") {
            updateData.kanbanStatus = "WONT_DO";
          } else {
            updateData.kanbanStatus = "DONE";
          }
        } else if (body.kanbanStatus === undefined) {
          updateData.kanbanStatus = "TODO";
        }
      }
    }

    // Subtasks update
    if (body.subtasks && Array.isArray(body.subtasks)) {
      // Delete existing and replace with new set
      await prisma.subtask.deleteMany({ where: { taskId: id } });
      await prisma.subtask.createMany({
        data: body.subtasks.map((st: any, idx: number) => ({
          taskId: id,
          title: st.title,
          completed: Boolean(st.completed),
          order: idx + 1,
        })),
      });
    }

    // Tags update
    if (body.tags && Array.isArray(body.tags)) {
      await prisma.taskTag.deleteMany({ where: { taskId: id } });
      const tagIds = body.tags
        .map((t: any) => (typeof t === "string" ? t : t?.tagId || t?.id))
        .filter(Boolean);

      if (tagIds.length > 0) {
        await prisma.taskTag.createMany({
          data: tagIds.map((tId: string) => ({
            taskId: id,
            tagId: tId,
          })),
        });
      }
    }

    // Assignees update
    if (Array.isArray(body.assigneeIds)) {
      const members = await prisma.listMember.findMany({
        where: { id: { in: body.assigneeIds }, list: { userId: user.id } },
        select: { id: true },
      });
      await prisma.taskAssignee.deleteMany({ where: { taskId: id } });
      if (members.length) {
        await prisma.taskAssignee.createMany({
          data: members.map((m) => ({ taskId: id, memberId: m.id })),
        });
      }
    }

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        list: true,
        group: true,
        subtasks: { orderBy: { order: "asc" } },
        tags: { include: { tag: true } },
        reminders: { orderBy: { createdAt: "asc" } },
        assignees: { include: { member: true } },
      },
    });

    return NextResponse.json({ task });
  } catch (err: any) {
    console.error("Failed to update task:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionAuth();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const permanent = searchParams.get("permanent") === "true";

    const existing = await prisma.task.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    if (existing.isTrash || permanent) {
      // Permanently delete
      await prisma.task.delete({ where: { id } });
      return NextResponse.json({ success: true, message: "Task permanently deleted" });
    } else {
      // Move to trash
      await prisma.task.update({
        where: { id },
        data: { isTrash: true },
      });
      return NextResponse.json({ success: true, message: "Task moved to trash" });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
