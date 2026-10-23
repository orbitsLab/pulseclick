import { prisma } from "./prisma";

export async function seedStarterTickTickDataForUser(userId: string) {
  const today = new Date();
  const formatIso = (d: Date) => d.toISOString().split("T")[0];
  const todayIso = formatIso(today);

  const tomorrowDt = new Date(today);
  tomorrowDt.setDate(tomorrowDt.getDate() + 1);
  const tomorrowIso = formatIso(tomorrowDt);

  const nextWeekDt = new Date(today);
  nextWeekDt.setDate(nextWeekDt.getDate() + 5);
  const nextWeekIso = formatIso(nextWeekDt);

  // 1. Seed default TickTick Lists
  const workList = await prisma.taskList.create({
    data: {
      userId,
      name: "Work",
      color: "#3b82f6",
      icon: "Briefcase",
      order: 1,
    },
  });

  const personalList = await prisma.taskList.create({
    data: {
      userId,
      name: "Personal",
      color: "#10b981",
      icon: "User",
      order: 2,
    },
  });

  const learningList = await prisma.taskList.create({
    data: {
      userId,
      name: "Learning",
      color: "#f59e0b",
      icon: "BookOpen",
      order: 3,
    },
  });

  // 2. Seed default Tags
  const urgentTag = await prisma.tag.create({
    data: { userId, name: "urgent", color: "#ef4444" },
  });
  const ideaTag = await prisma.tag.create({
    data: { userId, name: "idea", color: "#a855f7" },
  });
  const designTag = await prisma.tag.create({
    data: { userId, name: "design", color: "#06b6d4" },
  });

  // 3. Seed Starter Tasks with subtasks & priorities
  const task1 = await prisma.task.create({
    data: {
      userId,
      listId: workList.id,
      title: "Quarterly Roadmap Review & Architecture Sync",
      description: "Review system scalability milestones, database partitioning, and real-time syncing pipelines with the engineering team.",
      priority: 3, // High (Red)
      dueDate: todayIso,
      dueTime: "14:00",
      recurrence: "WEEKLY",
      isPinned: true,
      kanbanStatus: "IN_PROGRESS",
      pomodoroCount: 3,
      subtasks: {
        create: [
          { title: "Draft performance benchmark comparison", completed: true, order: 1 },
          { title: "Review database connection pool sizing", completed: false, order: 2 },
          { title: "Send notes to engineering team", completed: false, order: 3 },
        ],
      },
      tags: {
        create: [{ tagId: urgentTag.id }],
      },
    },
  });

  await prisma.task.create({
    data: {
      userId,
      listId: learningList.id,
      title: "Explore Next.js 16 Partial Prefetching patterns",
      description: "Deep dive into server action streaming, optimistic updates with TanStack Query, and client component boundary best practices.",
      priority: 2, // Medium (Yellow)
      dueDate: todayIso,
      dueTime: "17:30",
      recurrence: "NONE",
      kanbanStatus: "TODO",
      pomodoroCount: 1,
      subtasks: {
        create: [
          { title: "Read upstream documentation", completed: true, order: 1 },
          { title: "Test cacheComponents config in sandbox", completed: false, order: 2 },
        ],
      },
      tags: {
        create: [{ tagId: ideaTag.id }],
      },
    },
  });

  await prisma.task.create({
    data: {
      userId,
      listId: personalList.id,
      title: "Weekend cycling trail & gear check",
      description: "Inspect tire pressure, pack hydration bottles, and map out the 35km scenic river trail route.",
      priority: 1, // Low (Blue)
      dueDate: tomorrowIso,
      dueTime: "09:00",
      recurrence: "NONE",
      kanbanStatus: "TODO",
      subtasks: {
        create: [
          { title: "Check tire air & lube chain", completed: false, order: 1 },
          { title: "Download offline GPS map", completed: false, order: 2 },
        ],
      },
    },
  });

  await prisma.task.create({
    data: {
      userId,
      listId: null, // Inbox
      title: "Research sound design for micro-interactions",
      description: "Use Web Audio API oscillator synthesis for smooth task check-off and timer bells.",
      priority: 0, // None
      dueDate: nextWeekIso,
      recurrence: "NONE",
      kanbanStatus: "TODO",
      tags: {
        create: [{ tagId: designTag.id }],
      },
    },
  });

  // 4. Seed sample Pomodoro session
  await prisma.pomodoroSession.create({
    data: {
      userId,
      taskId: task1.id,
      durationMinutes: 25,
      completedAt: new Date(),
    },
  });

  // 5. Seed default TickTick Habits
  const habit1 = await prisma.habit.create({
    data: {
      userId,
      title: "Morning Workout & Stretching",
      icon: "Dumbbell",
      color: "#ef4444",
      frequency: "DAILY",
      targetDays: 7,
      order: 1,
    },
  });

  const habit2 = await prisma.habit.create({
    data: {
      userId,
      title: "Read 20 pages of non-fiction",
      icon: "BookOpen",
      color: "#3b82f6",
      frequency: "DAILY",
      targetDays: 7,
      order: 2,
    },
  });

  const habit3 = await prisma.habit.create({
    data: {
      userId,
      title: "Drink 2L Water",
      icon: "Droplets",
      color: "#06b6d4",
      frequency: "DAILY",
      targetDays: 7,
      order: 3,
    },
  });

  await prisma.habitLog.create({
    data: {
      habitId: habit3.id,
      date: todayIso,
      completed: true,
    },
  });

  // 6. Seed scheduled tasks for the Timeline view
  const inThreeDays = new Date(today);
  inThreeDays.setDate(inThreeDays.getDate() + 3);
  const inFiveDays = new Date(today);
  inFiveDays.setDate(inFiveDays.getDate() + 5);

  await prisma.task.create({
    data: {
      userId,
      listId: workList.id,
      title: "Migrate the billing service to the new queue",
      description: "Timed project block so the timeline shows how long the work takes.",
      priority: 3,
      dueDate: inThreeDays.toISOString().split("T")[0],
      dueTime: "13:00",
      startDate: inThreeDays.toISOString().split("T")[0],
      startTime: "09:00",
      endDate: inThreeDays.toISOString().split("T")[0],
      endTime: "12:00",
      durationMinutes: 180,
      kanbanStatus: "TODO",
    },
  });

  await prisma.task.create({
    data: {
      userId,
      listId: learningList.id,
      title: "Write the release notes draft",
      priority: 2,
      dueDate: inFiveDays.toISOString().split("T")[0],
      startDate: inThreeDays.toISOString().split("T")[0],
      startTime: "14:00",
      endDate: inFiveDays.toISOString().split("T")[0],
      endTime: "16:00",
      durationMinutes: 300,
      kanbanStatus: "TODO",
    },
  });

  // 7. Seed reminders on the first task
  await prisma.reminder.create({
    data: { taskId: task1.id, type: "AT_TIME", remindAt: "14:00" },
  });
  await prisma.reminder.create({
    data: { taskId: task1.id, type: "15_MIN", minutesBefore: 15 },
  });

  // 8. Seed a smart filter
  await prisma.filter.create({
    data: {
      userId,
      name: "High priority",
      icon: "Flag",
      color: "#ef4444",
      query: JSON.stringify({ priorities: [3], status: "open" }),
      order: 1,
    },
  });

  await prisma.filter.create({
    data: {
      userId,
      name: "This week",
      icon: "CalendarDays",
      color: "#4772fa",
      query: JSON.stringify({
        dueFrom: todayIso,
        dueTo: nextWeekIso,
        status: "open",
      }),
      order: 2,
    },
  });

  // 9. Seed countdowns
  const inTenDays = new Date(today);
  inTenDays.setDate(inTenDays.getDate() + 10);
  await prisma.countdown.create({
    data: {
      userId,
      title: "Product launch",
      targetDate: inTenDays.toISOString().split("T")[0],
      color: "#4772fa",
      emoji: "🚀",
    },
  });

  const inThirtyDays = new Date(today);
  inThirtyDays.setDate(inThirtyDays.getDate() + 30);
  await prisma.countdown.create({
    data: {
      userId,
      title: "Conference talk",
      targetDate: inThirtyDays.toISOString().split("T")[0],
      color: "#7950f2",
      emoji: "🎤",
    },
  });

  // 10. Seed a collaboration member on the work list
  const member = await prisma.listMember.create({
    data: {
      listId: workList.id,
      email: "teammate@example.com",
      displayName: "Alex Rivera",
      role: "EDITOR",
      status: "INVITED",
    },
  });

  await prisma.taskAssignee.create({
    data: { taskId: task1.id, memberId: member.id },
  });
}
