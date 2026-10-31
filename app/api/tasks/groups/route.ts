import { NextResponse } from "next/server";
import { getSessionAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const user = await getSessionAuth();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const listId = searchParams.get("listId");

    const where: { userId: string; listId?: string } = { userId: user.id };
    if (listId) {
      where.listId = listId;
    }

    const groups = await prisma.taskGroup.findMany({
      where,
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

    return NextResponse.json({ groups });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionAuth();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { listId, name, color } = body;

    if (!listId) {
      return NextResponse.json({ error: "listId is required" }, { status: 400 });
    }
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Group name is required" }, { status: 400 });
    }

    const list = await prisma.taskList.findFirst({
      where: { id: listId, userId: user.id },
    });
    if (!list) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    const lastGroup = await prisma.taskGroup.findFirst({
      where: { listId },
      orderBy: { order: "desc" },
    });
    const nextOrder = (lastGroup?.order ?? 0) + 1;

    const group = await prisma.taskGroup.create({
      data: {
        listId,
        userId: user.id,
        name: name.trim(),
        color: color || "#4772fa",
        order: nextOrder,
        collapsed: false,
      },
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

    return NextResponse.json({ group }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
