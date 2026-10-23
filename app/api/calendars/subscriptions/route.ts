import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const subscriptions = await prisma.calendarSubscription.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ subscriptions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, url, color, listId } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "A calendar name is required" }, { status: 400 });
    }
    if (!url || !/^https?:\/\//i.test(url)) {
      return NextResponse.json(
        { error: "A valid http(s) ICS URL is required" },
        { status: 400 }
      );
    }

    if (listId) {
      const list = await prisma.taskList.findFirst({
        where: { id: listId, userId: user.id },
        select: { id: true },
      });
      if (!list) return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    const subscription = await prisma.calendarSubscription.create({
      data: {
        userId: user.id,
        name: name.trim(),
        url,
        color: color || "#4772fa",
        listId: listId || null,
      },
    });

    return NextResponse.json({ subscription }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
