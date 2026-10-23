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

    const existing = await prisma.reminder.findFirst({
      where: { id, task: { userId: user.id } },
    });
    if (!existing) return NextResponse.json({ error: "Reminder not found" }, { status: 404 });

    const updateData: any = {};
    if (body.type !== undefined) updateData.type = body.type;
    if (body.remindAt !== undefined) updateData.remindAt = body.remindAt || null;
    if (body.minutesBefore !== undefined)
      updateData.minutesBefore = body.minutesBefore === null ? null : Number(body.minutesBefore);
    if (body.enabled !== undefined) updateData.enabled = Boolean(body.enabled);

    const reminder = await prisma.reminder.update({ where: { id }, data: updateData });
    return NextResponse.json({ reminder });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const existing = await prisma.reminder.findFirst({
      where: { id, task: { userId: user.id } },
    });
    if (!existing) return NextResponse.json({ error: "Reminder not found" }, { status: 404 });

    await prisma.reminder.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
