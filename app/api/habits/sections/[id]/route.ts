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

    const existing = await prisma.habitSection.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) return NextResponse.json({ error: "Section not found" }, { status: 404 });

    const section = await prisma.habitSection.update({
      where: { id },
      data: {
        name: body.name !== undefined ? body.name.trim() : undefined,
        order: body.order !== undefined ? Number(body.order) : undefined,
        collapsed: body.collapsed !== undefined ? Boolean(body.collapsed) : undefined,
      },
    });

    return NextResponse.json({ section });
  } catch (err: any) {
    console.error("Failed to update habit section:", err);
    return NextResponse.json({ error: err.message || "Failed to update section" }, { status: 500 });
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

    const existing = await prisma.habitSection.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) return NextResponse.json({ error: "Section not found" }, { status: 404 });

    // Set habits in this section to have sectionId = null
    await prisma.habit.updateMany({
      where: { sectionId: id, userId: user.id },
      data: { sectionId: null },
    });

    await prisma.habitSection.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Failed to delete habit section:", err);
    return NextResponse.json({ error: err.message || "Failed to delete section" }, { status: 500 });
  }
}
