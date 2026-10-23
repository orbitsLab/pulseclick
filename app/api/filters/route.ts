import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseFilterQuery, serializeFilterQuery } from "@/lib/filters";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const filters = await prisma.filter.findMany({
      where: { userId: user.id },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({
      filters: filters.map((f) => ({ ...f, query: parseFilterQuery(f.query) })),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, icon, color, query } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Filter name is required" }, { status: 400 });
    }

    const last = await prisma.filter.findFirst({
      where: { userId: user.id },
      orderBy: { order: "desc" },
    });

    const filter = await prisma.filter.create({
      data: {
        userId: user.id,
        name: name.trim(),
        icon: icon || "Filter",
        color: color || "#4772fa",
        query: serializeFilterQuery(query ?? {}),
        order: (last?.order ?? 0) + 1,
      },
    });

    return NextResponse.json(
      { filter: { ...filter, query: parseFilterQuery(filter.query) } },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
