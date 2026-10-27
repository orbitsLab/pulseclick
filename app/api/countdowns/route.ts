import { NextResponse } from "next/server";
import { getSessionAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getSessionAuth();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const countdowns = await prisma.countdown.findMany({
      where: { userId: user.id },
      orderBy: { targetDate: "asc" },
    });

    return NextResponse.json({ countdowns });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionAuth();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { title, targetDate, color, emoji, repeat } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (!targetDate || !/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
      return NextResponse.json({ error: "A valid target date is required" }, { status: 400 });
    }

    const countdown = await prisma.countdown.create({
      data: {
        userId: user.id,
        title: title.trim(),
        targetDate,
        color: color || "#4772fa",
        emoji: emoji || null,
        repeat: repeat || "NONE",
      },
    });

    return NextResponse.json({ countdown }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
