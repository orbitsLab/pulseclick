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

    const existing = await prisma.taskGroup.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) return NextResponse.json({ error: "Group not found" }, { status: 404 });

    const updateData: {
      name?: string;
      color?: string;
      order?: number;
      collapsed?: boolean;
    } = {};

    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.color !== undefined) updateData.color = body.color;
    if (body.order !== undefined) updateData.order = body.order;
    if (body.collapsed !== undefined) updateData.collapsed = Boolean(body.collapsed);

    const group = await prisma.taskGroup.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({ group });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
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

    const existing = await prisma.taskGroup.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) return NextResponse.json({ error: "Group not found" }, { status: 404 });

    // Explicitly nullify groupId on child tasks so tasks stay in the list as ungrouped
    await prisma.task.updateMany({
      where: { groupId: id, userId: user.id },
      data: { groupId: null },
    });

    await prisma.taskGroup.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Group deleted" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
