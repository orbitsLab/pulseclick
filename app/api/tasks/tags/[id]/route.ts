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

    const existing = await prisma.tag.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) return NextResponse.json({ error: "Tag not found" }, { status: 404 });

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name.trim().toLowerCase().replace(/^#/, "");
    if (body.color !== undefined) updateData.color = body.color;

    const tag = await prisma.tag.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ tag });
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

    const existing = await prisma.tag.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) return NextResponse.json({ error: "Tag not found" }, { status: 404 });

    await prisma.tag.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Tag deleted" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
