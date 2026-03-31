/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getUserProfile, updateUserProfile } from "@/lib/user";
import { auth } from "@/lib/auth";
import bcrypt from "bcrypt";
import { revalidateTag } from "next/cache";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Not logged in." },
      { status: 401 }
    );
  }

  const user = await getUserProfile(session.user.id);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "User not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, user });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Not logged in." },
      { status: 401 }
    );
  }

  try {
    const formData = await req.formData();
    const firstname = formData.get("firstname") as string;
    const lastname = formData.get("lastname") as string;
    const email = formData.get("email") as string;
    const username = formData.get("username") as string;
    const newPassword = formData.get("password") as string;

    const updates: Partial<{
      firstname: string;
      lastname: string;
      email: string;
      username: string;
      password: string;
    }> = {
      firstname,
      lastname,
      email,
      username,
    };

    if (newPassword && newPassword.trim() !== "") {
      const hashed = await bcrypt.hash(newPassword.trim(), 10);
      updates.password = hashed;
    }

    const updated = await updateUserProfile(session.user.id, updates);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Update failed." },
        { status: 400 }
      );
    }

    revalidateTag(`user-profile-${session.user.id}`, "minutes");
    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || "Error updating user.",
    });
  }
}
