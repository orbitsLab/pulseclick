import { NextResponse } from "next/server";
import { getSessionAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getSessionAuth();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const sections = await prisma.habitSection.findMany({
      where: { userId: user.id },
      orderBy: { order: "asc" },
      include: {
        _count: {
          select: { habits: true },
        },
      },
    });

    return NextResponse.json({ sections });
  } catch (err: any) {
    console.error("Failed to load habit sections:", err);
    return NextResponse.json({ error: err.message || "Failed to load sections" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionAuth();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Section name is required" }, { status: 400 });
    }

    const lastSection = await prisma.habitSection.findFirst({
      where: { userId: user.id },
      orderBy: { order: "desc" },
    });
    const nextOrder = (lastSection?.order ?? 0) + 1;

    const section = await prisma.habitSection.create({
      data: {
        userId: user.id,
        name: name.trim(),
        order: nextOrder,
      },
    });

    return NextResponse.json({ section }, { status: 201 });
  } catch (err: any) {
    console.error("Failed to create habit section:", err);
    return NextResponse.json({ error: err.message || "Failed to create section" }, { status: 500 });
  }
}
