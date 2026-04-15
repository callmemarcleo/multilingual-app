"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export type SignInState = { error: string | null };

export async function signInAction(
  _prevState: SignInState,
  formData: FormData
): Promise<SignInState> {
  try {
    await signIn("credentials", formData);
    return { error: null };
  } catch (error) {
    // Next.js throws a special error for server-side redirects — re-throw it
    if (isRedirectError(error)) throw error;

    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }

    return { error: "An unexpected error occurred. Please try again." };
  }
}