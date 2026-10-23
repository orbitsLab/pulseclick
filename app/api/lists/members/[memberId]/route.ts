import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { memberId } = await params;
    const body = await req.json();

    const existing = await prisma.listMember.findFirst({
      where: { id: memberId, list: { userId: user.id } },
    });
    if (!existing) return NextResponse.json({ error: "Member not found" }, { status: 404 });

    const updateData: any = {};
    if (body.role !== undefined) updateData.role = body.role;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.displayName !== undefined) updateData.displayName = body.displayName;

    const member = await prisma.listMember.update({
      where: { id: memberId },
      data: updateData,
      include: { _count: { select: { assignments: true } } },
    });

    return NextResponse.json({
      member: {
        id: member.id,
        email: member.email,
        displayName: member.displayName,
        role: member.role,
        status: member.status,
        assignments: member._count.assignments,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { memberId } = await params;
    const existing = await prisma.listMember.findFirst({
      where: { id: memberId, list: { userId: user.id } },
    });
    if (!existing) return NextResponse.json({ error: "Member not found" }, { status: 404 });

    await prisma.listMember.delete({ where: { id: memberId } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
