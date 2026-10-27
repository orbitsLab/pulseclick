import { NextResponse } from "next/server";
import { getSessionAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTheme, DEFAULT_THEME_ID } from "@/lib/themes";

export async function GET() {
  try {
    const user = await getSessionAuth();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const settings = await prisma.user.findUnique({
      where: { id: user.id },
      select: { themeId: true, timezone: true },
    });

    const lists = await prisma.taskList.findMany({
      where: { userId: user.id },
      select: { id: true, background: true },
    });

    const effectiveThemeId = getTheme(settings?.themeId).id;

    return NextResponse.json({
      themeId: effectiveThemeId,
      timezone: settings?.timezone ?? "UTC",
      listBackgrounds: Object.fromEntries(
        lists.map((l) => [l.id, l.background ?? "none"])
      ),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getSessionAuth();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const updateData: any = {};
    if (body.themeId !== undefined) {
      updateData.themeId = getTheme(String(body.themeId)).id;
    }
    if (body.timezone !== undefined) updateData.timezone = String(body.timezone);

    if (Object.keys(updateData).length) {
      await prisma.user.update({ where: { id: user.id }, data: updateData });
    }

    const updated = await prisma.user.findUnique({
      where: { id: user.id },
      select: { themeId: true, timezone: true },
    });

    return NextResponse.json({
      themeId: getTheme(updated?.themeId).id,
      timezone: updated?.timezone ?? "UTC",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
