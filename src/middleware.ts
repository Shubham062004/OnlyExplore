import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (token.plan !== "pro") {
    return NextResponse.json({ error: "Upgrade required" }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/premium/:path*",
    "/api/pro/:path*",
  ],
};
