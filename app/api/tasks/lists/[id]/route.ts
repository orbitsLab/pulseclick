import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.taskList.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) return NextResponse.json({ error: "List not found" }, { status: 404 });

    const updateData: {
      name?: string;
      color?: string;
      icon?: string;
      background?: string;
      order?: number;
    } = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.color !== undefined) updateData.color = body.color;
    if (body.icon !== undefined) updateData.icon = body.icon;
    if (body.background !== undefined) updateData.background = body.background || "none";
    if (body.order !== undefined) updateData.order = body.order;

    const list = await prisma.taskList.update({
      where: { id },
      data: updateData,
      include: {
        groups: true,
      },
    });

    return NextResponse.json({ list });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const existing = await prisma.taskList.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) return NextResponse.json({ error: "List not found" }, { status: 404 });

    // Move all tasks in this list to inbox (listId = null)
    await prisma.task.updateMany({
      where: { listId: id, userId: user.id },
      data: { listId: null },
    });

    // Delete list
    await prisma.taskList.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "List deleted" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
