import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/sign-in", "/sign-up"];

export default function proxy(req: NextRequest) {
  const sessionToken =
    req.cookies.get("authjs.session-token") ??
    req.cookies.get("__Secure-authjs.session-token");

  const isLoggedIn = !!sessionToken;
  const { pathname } = req.nextUrl;

  const isPublic = PUBLIC_PATHS.includes(pathname);

  if (isLoggedIn && isPublic) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (!isLoggedIn && !isPublic) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }
}

export const config = {
  matcher: [

    "/((?!_next/static|_next/image|favicon\\.ico|img/|gemuese/|officesupplies/|fruits/|grains/|api/).*)",
  ],
};