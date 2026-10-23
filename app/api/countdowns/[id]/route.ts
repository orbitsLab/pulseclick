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

    const existing = await prisma.countdown.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) return NextResponse.json({ error: "Countdown not found" }, { status: 404 });

    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.targetDate !== undefined) updateData.targetDate = body.targetDate;
    if (body.color !== undefined) updateData.color = body.color;
    if (body.emoji !== undefined) updateData.emoji = body.emoji || null;
    if (body.repeat !== undefined) updateData.repeat = body.repeat;

    const countdown = await prisma.countdown.update({ where: { id }, data: updateData });
    return NextResponse.json({ countdown });
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
    const existing = await prisma.countdown.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) return NextResponse.json({ error: "Countdown not found" }, { status: 404 });

    await prisma.countdown.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
