import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_COOKIE = "jarcode_admin_session";
const CLIENT_COOKIE = "jarcode_client_session";

function tokenNotExpired(token: string | undefined) {
  if (!token) return false;
  const parts = token.split("|");
  if (parts.length < 3) return false;
  const exp = Number(parts[parts.length - 2]);
  if (!Number.isFinite(exp) || Date.now() > exp) return false;
  return true;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin/login")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get(ADMIN_COOKIE)?.value;
    if (!tokenNotExpired(token)) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith("/erp")) {
    const token = request.cookies.get(CLIENT_COOKIE)?.value;
    if (!tokenNotExpired(token)) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", "/erp");
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/erp", "/erp/:path*"],
};
