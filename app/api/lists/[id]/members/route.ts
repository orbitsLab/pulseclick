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
    const list = await prisma.taskList.findFirst({
      where: { id, userId: user.id },
    });
    if (!list) return NextResponse.json({ error: "List not found" }, { status: 404 });

    const members = await prisma.listMember.findMany({
      where: { listId: id },
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { assignments: true } } },
    });

    return NextResponse.json({
      members: members.map((m) => ({
        id: m.id,
        email: m.email,
        displayName: m.displayName,
        role: m.role,
        status: m.status,
        assignments: m._count.assignments,
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
    const { email, displayName, role } = body;

    if (!email || !String(email).includes("@")) {
      return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
    }

    const list = await prisma.taskList.findFirst({
      where: { id, userId: user.id },
    });
    if (!list) return NextResponse.json({ error: "List not found" }, { status: 404 });

    const normalized = String(email).trim().toLowerCase();

    const existing = await prisma.listMember.findFirst({
      where: { listId: id, email: normalized },
    });
    if (existing) {
      return NextResponse.json({ error: "That person is already a member" }, { status: 409 });
    }

    const invitedUser = await prisma.user.findUnique({
      where: { email: normalized },
      select: { id: true, name: true },
    });

    const member = await prisma.listMember.create({
      data: {
        listId: id,
        userId: invitedUser?.id ?? null,
        email: normalized,
        displayName:
          displayName?.trim() || invitedUser?.name || normalized.split("@")[0],
        role: role || "EDITOR",
        status: invitedUser ? "ACCEPTED" : "INVITED",
      },
      include: { _count: { select: { assignments: true } } },
    });

    return NextResponse.json(
      {
        member: {
          id: member.id,
          email: member.email,
          displayName: member.displayName,
          role: member.role,
          status: member.status,
          assignments: member._count.assignments,
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
