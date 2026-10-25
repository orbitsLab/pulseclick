import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
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

    const isArchived = existing.status === "ARCHIVED";
    const nextStatus = isArchived ? "ACTIVE" : "ARCHIVED";
    const nextArchivedAt = isArchived ? null : new Date();

    const updated = await prisma.habit.update({
      where: { id },
      data: {
        status: nextStatus,
        archivedAt: nextArchivedAt,
      },
      include: {
        section: true,
        logs: {
          orderBy: { date: "desc" },
          take: 30,
        },
      },
    });

    return NextResponse.json({ habit: updated, archived: !isArchived });
  } catch (err: any) {
    console.error("Failed to toggle habit archive status:", err);
    return NextResponse.json({ error: err.message || "Failed to archive habit" }, { status: 500 });
  }
}
