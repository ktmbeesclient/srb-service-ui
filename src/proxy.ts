import { NextRequest, NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode";

interface TokenPayload {
  client_id: string;
  client_role: string;
  exp: number;
}

export function proxy(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const payload = jwtDecode<TokenPayload>(token);
    const pathname = request.nextUrl.pathname;

    if (
      pathname.startsWith("/admin") &&
      payload.client_role !== "SUPER_ADMIN"
    ) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (
      pathname.startsWith("/client") &&
      payload.client_role !== "CLIENT"
    ) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/admin/:path*", "/client/:path*"],
};