import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTodayISO, addDays } from "@/lib/date-utils";
import { parseFilterQuery, buildFilterWhere } from "@/lib/filters";

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const view = searchParams.get("view") || "all";
    const listId = searchParams.get("listId");
    const tag = searchParams.get("tag");
    const search = searchParams.get("search");
    const filterId = searchParams.get("filter");
    const today = getTodayISO();
    const next7Days = addDays(today, 7);

    const where: any = {
      userId: user.id,
      isTrash: view === "trash",
    };

    if (view === "completed") {
      where.completed = true;
    }

    // Smart List Filtering
    if (view === "inbox") {
      where.listId = null;
    } else if (view === "today") {
      where.dueDate = { lte: today };
    } else if (view === "tomorrow") {
      const tomorrow = addDays(today, 1);
      where.dueDate = tomorrow;
    } else if (view === "next7") {
      where.dueDate = { gte: today, lte: next7Days };
    } else if (view === "timeline" || view === "calendar") {
      // The timeline and calendar show the schedule, including finished work.
      delete where.completed;
    }

    if (listId && listId !== "inbox" && listId !== "all") {
      where.listId = listId;
    }

    if (tag) {
      where.tags = {
        some: {
          tag: { name: tag },
        },
      };
    }

    if (search && search.trim()) {
      where.OR = [
        { title: { contains: search.trim(), mode: "insensitive" } },
        { description: { contains: search.trim(), mode: "insensitive" } },
      ];
    }

    // Saved smart filter
    if (filterId) {
      const filter = await prisma.filter.findFirst({
        where: { id: filterId, userId: user.id },
      });
      if (filter) {
        const filterWhere = buildFilterWhere(parseFilterQuery(filter.query));
        Object.assign(where, filterWhere);
      }
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [
        { isPinned: "desc" },
        { priority: "desc" },
        { dueDate: "asc" },
        { order: "asc" },
        { createdAt: "desc" },
      ],
      include: {
        list: true,
        subtasks: {
          orderBy: { order: "asc" },
        },
        tags: {
          include: { tag: true },
        },
        reminders: {
          orderBy: { createdAt: "asc" },
        },
        assignees: {
          include: { member: true },
        },
      },
    });

    return NextResponse.json({ tasks });
  } catch (err: any) {
    console.error("Failed to fetch tasks:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch tasks" },
      { status: 500 }
    );
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
      description,
      listId,
      dueDate,
      dueTime,
      priority,
      recurrence,
      recurrenceInterval,
      recurrenceWeekdays,
      recurrenceEndDate,
      reminder,
      tags,
      subtasks,
      kanbanStatus,
      startDate,
      startTime,
      endDate,
      endTime,
      durationMinutes,
      timeZone,
      reminders,
      assigneeIds,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Task title is required" }, { status: 400 });
    }

    // Format listId (if "inbox" or empty, listId is null)
    const validListId = listId && listId !== "inbox" ? listId : null;

    const task = await prisma.task.create({
      data: {
        userId: user.id,
        title: title.trim(),
        description: description?.trim() || null,
        listId: validListId,
        dueDate: dueDate || null,
        dueTime: dueTime || null,
        priority: Number(priority) || 0,
        recurrence: recurrence || "NONE",
        recurrenceInterval: Number(recurrenceInterval) || 1,
        recurrenceWeekdays: recurrenceWeekdays || null,
        recurrenceEndDate: recurrenceEndDate || null,
        reminder: reminder || "NONE",
        kanbanStatus: kanbanStatus || "TODO",
        startDate: startDate || null,
        startTime: startTime || null,
        endDate: endDate || null,
        endTime: endTime || null,
        durationMinutes: Number(durationMinutes) || 0,
        timeZone: timeZone || null,
        subtasks: subtasks && Array.isArray(subtasks)
          ? {
              create: subtasks.map((st: any, idx: number) => ({
                title: typeof st === "string" ? st : st.title,
                completed: false,
                order: idx + 1,
              })),
            }
          : undefined,
        tags: tags && Array.isArray(tags)
          ? {
              create: tags.map((tId: string) => ({
                tagId: tId,
              })),
            }
          : undefined,
        reminders:
          reminders && Array.isArray(reminders)
            ? {
                create: reminders.map((r: any) => ({
                  type: r.type || "AT_TIME",
                  remindAt: r.remindAt || null,
                  minutesBefore:
                    r.minutesBefore === undefined || r.minutesBefore === null
                      ? null
                      : Number(r.minutesBefore),
                  enabled: r.enabled === undefined ? true : Boolean(r.enabled),
                })),
              }
            : undefined,
      },
      include: {
        list: true,
        subtasks: true,
        tags: { include: { tag: true } },
        reminders: true,
      },
    });

    // Assign the task to list members when requested.
    if (assigneeIds && Array.isArray(assigneeIds) && assigneeIds.length) {
      const members = await prisma.listMember.findMany({
        where: { id: { in: assigneeIds }, list: { userId: user.id } },
        select: { id: true },
      });
      if (members.length) {
        await prisma.taskAssignee.createMany({
          data: members.map((m) => ({ taskId: task.id, memberId: m.id })),
        });
      }
    }

    const created = await prisma.task.findUnique({
      where: { id: task.id },
      include: {
        list: true,
        subtasks: true,
        tags: { include: { tag: true } },
        reminders: true,
        assignees: { include: { member: true } },
      },
    });

    return NextResponse.json({ task: created }, { status: 201 });
  } catch (err: any) {
    console.error("Failed to create task:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create task" },
      { status: 500 }
    );
  }
}
