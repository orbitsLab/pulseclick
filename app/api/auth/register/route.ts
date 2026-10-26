import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signSession, AUTH_COOKIE_NAME } from "@/lib/auth";
import { seedStarterWorkspaceDataForUser } from "@/lib/seed-user";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email: cleanEmail,
        password: hashedPassword,
        name: name?.trim() || cleanEmail.split("@")[0],
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    // Automatically populate new user accounts with starter workspace data
    try {
      await seedStarterWorkspaceDataForUser(user.id);
    } catch (seedErr) {
      console.error("Failed to seed starter data:", seedErr);
    }

    const token = await signSession({
      userId: user.id,
      email: user.email,
    });

    const response = NextResponse.json(
      { success: true, user },
      { status: 201 }
    );

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("Registration error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to register" },
      { status: 500 }
    );
  }
}
