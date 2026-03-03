import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  const isApiRoute = pathname.startsWith("/api/");

  if (!token) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/api/auth/signin", req.url));
  }

  if (token.plan !== "pro") {
    if (isApiRoute) {
      return NextResponse.json({ error: "Upgrade required" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/profile", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/premium/:path*",
    "/pro/:path*",
    "/api/premium/:path*",
    "/api/pro/:path*",
  ],
};
