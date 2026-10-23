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

    const existing = await prisma.habit.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) return NextResponse.json({ error: "Habit not found" }, { status: 404 });

    const habit = await prisma.habit.update({
      where: { id },
      data: {
        title: body.title !== undefined ? body.title.trim() : undefined,
        icon: body.icon !== undefined ? body.icon : undefined,
        color: body.color !== undefined ? body.color : undefined,
        frequency: body.frequency !== undefined ? body.frequency : undefined,
        targetDays: body.targetDays !== undefined ? Number(body.targetDays) : undefined,
      },
    });

    return NextResponse.json({ habit });
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

    const existing = await prisma.habit.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) return NextResponse.json({ error: "Habit not found" }, { status: 404 });

    await prisma.habit.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
