import { NextResponse } from "next/server";
import { getSessionAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const user = await getSessionAuth();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const lists = await prisma.taskList.findMany({
      where: { userId: user.id },
      orderBy: { order: "asc" },
      include: {
        _count: {
          select: {
            tasks: {
              where: { completed: false, isTrash: false },
            },
          },
        },
      },
    });

    return NextResponse.json({ lists, inboxCount: 0, todayCount: 0, tomorrowCount: 0, allCount: 0 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionAuth();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, color, icon } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "List name is required" }, { status: 400 });
    }

    const lastList = await prisma.taskList.findFirst({
      where: { userId: user.id },
      orderBy: { order: "desc" },
    });
    const nextOrder = (lastList?.order ?? 0) + 1;

    const list = await prisma.taskList.create({
      data: {
        userId: user.id,
        name: name.trim(),
        color: color || "#14b8a6",
        icon: icon || "Folder",
        order: nextOrder,
      },
    });

    return NextResponse.json({ list }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
