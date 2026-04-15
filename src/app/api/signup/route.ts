import { NextResponse } from "next/server";
import db from "@/lib/db";
import bcrypt from "bcrypt";
import { z } from "zod";
import { userSignupSchema } from "@/lib/schema";

const signupRequestSchema = userSignupSchema
  .extend({ confirmPassword: z.string() })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = signupRequestSchema.parse(body);

    const hashedPassword = await bcrypt.hash(parsed.password, 10);

    await db.user.create({
      data: {
        firstname: parsed.firstname,
        lastname: parsed.lastname,
        username: parsed.username,
        email: parsed.email.toLowerCase(),
        password: hashedPassword,
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: err.errors[0].message },
        { status: 400 }
      );
    }

    // Prisma unique constraint violation (duplicate email or username)
    if ((err as { code?: string })?.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    console.error(err);
    return NextResponse.json(
      { success: false, error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}