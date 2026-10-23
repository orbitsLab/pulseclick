import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const task = await prisma.task.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const assignees = await prisma.taskAssignee.findMany({
      where: { taskId: id },
      include: { member: true },
    });

    return NextResponse.json({
      assignees: assignees.map((a) => ({
        id: a.member.id,
        email: a.member.email,
        displayName: a.member.displayName,
        role: a.member.role,
        status: a.member.status,
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const memberIds: string[] = Array.isArray(body.memberIds)
      ? body.memberIds
      : body.memberId
      ? [body.memberId]
      : [];

    if (!memberIds.length) {
      return NextResponse.json({ error: "memberIds is required" }, { status: 400 });
    }

    const task = await prisma.task.findFirst({
      where: { id, userId: user.id },
    });
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const members = await prisma.listMember.findMany({
      where: { id: { in: memberIds }, list: { userId: user.id } },
      select: { id: true },
    });

    for (const member of members) {
      await prisma.taskAssignee.upsert({
        where: { taskId_memberId: { taskId: id, memberId: member.id } },
        create: { taskId: id, memberId: member.id },
        update: {},
      });
    }

    const assignees = await prisma.taskAssignee.findMany({
      where: { taskId: id },
      include: { member: true },
    });

    return NextResponse.json({
      assignees: assignees.map((a) => ({
        id: a.member.id,
        email: a.member.email,
        displayName: a.member.displayName,
        role: a.member.role,
        status: a.member.status,
      })),
    });
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
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId");

    const task = await prisma.task.findFirst({
      where: { id, userId: user.id },
    });
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    if (memberId) {
      await prisma.taskAssignee.deleteMany({ where: { taskId: id, memberId } });
    } else {
      await prisma.taskAssignee.deleteMany({ where: { taskId: id } });
    }

    const assignees = await prisma.taskAssignee.findMany({
      where: { taskId: id },
      include: { member: true },
    });

    return NextResponse.json({
      assignees: assignees.map((a) => ({
        id: a.member.id,
        email: a.member.email,
        displayName: a.member.displayName,
        role: a.member.role,
        status: a.member.status,
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
