import { NextRequest, NextResponse } from "next/server";

export default async function proxy(req: NextRequest) {
  const sessionToken =
    req.cookies.get("authjs.session-token") ??
    req.cookies.get("__Secure-authjs.session-token");

  const isLoggedIn = !!sessionToken;
  const path = req.nextUrl.pathname;

  if (isLoggedIn && (path === "/sign-in" || path === "/sign-up")) {
    return NextResponse.redirect(new URL("/", req.url));
  }
}

export const config = {
  matcher: ["/sign-in", "/sign-up"],
};