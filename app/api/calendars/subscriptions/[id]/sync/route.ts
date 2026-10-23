import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseIcs, eventDurationMinutes } from "@/lib/ics";

/**
 * Fetch the subscribed ICS feed and import its events as scheduled tasks.
 * Events that already exist (same title + start date) are skipped so the
 * operation can be repeated safely.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const subscription = await prisma.calendarSubscription.findFirst({
      where: { id, userId: user.id },
    });
    if (!subscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    let feedText: string;
    try {
      const response = await fetch(subscription.url, {
        headers: { Accept: "text/calendar, text/plain, */*" },
        cache: "no-store",
      });
      if (!response.ok) {
        return NextResponse.json(
          { error: `The calendar feed responded with ${response.status}` },
          { status: 502 }
        );
      }
      feedText = await response.text();
    } catch (err: any) {
      return NextResponse.json(
        { error: `Could not reach the calendar feed: ${err.message}` },
        { status: 502 }
      );
    }

    const events = parseIcs(feedText).filter((e) => e.startDate);

    const existing = await prisma.task.findMany({
      where: {
        userId: user.id,
        listId: subscription.listId ?? null,
        isTrash: false,
      },
      select: { title: true, dueDate: true },
    });
    const seen = new Set(existing.map((t) => `${t.title}::${t.dueDate ?? ""}`));

    let imported = 0;
    for (const event of events) {
      const key = `${event.summary}::${event.startDate}`;
      if (seen.has(key)) continue;
      seen.add(key);

      await prisma.task.create({
        data: {
          userId: user.id,
          listId: subscription.listId ?? null,
          title: event.summary,
          description: event.description ?? null,
          dueDate: event.startDate,
          dueTime: event.startTime,
          startDate: event.startDate,
          startTime: event.startTime,
          endDate: event.endDate,
          endTime: event.endTime,
          durationMinutes: eventDurationMinutes(event),
          recurrence: "NONE",
          reminder: "NONE",
          kanbanStatus: "TODO",
        },
      });
      imported += 1;
    }

    const updated = await prisma.calendarSubscription.update({
      where: { id },
      data: { lastSyncedAt: new Date() },
    });

    return NextResponse.json({ imported, total: events.length, subscription: updated });
  } catch (err: any) {
    console.error("Calendar sync failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
