import { NextResponse, type NextRequest } from "next/server";

const AUTH_COOKIE_NAME = "reserv_auth_token";

// Routes that do not require authentication
const PUBLIC_PREFIXES = [
  "/login",
  "/reservation",
  "/b/", // Public studio page, e.g. /b/bloom
  "/r/", // Customer reservation page, e.g. /r/ABC123
  "/pay/", // Customer payment page, e.g. /pay/ABC123
  "/api/webhooks",
];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix.endsWith("/") ? prefix : `${prefix}/`)
  );
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const isAuthenticated = Boolean(token && token.trim().length > 0);

  // 2. Allow all public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // 3. For protected studio workspace routes: redirect unauthenticated users to /login
  if (!isAuthenticated) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const loginUrl = new URL("/login", request.url);
    if (pathname && pathname !== "/") {
      loginUrl.searchParams.set("next", `${pathname}${search || ""}`);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static assets (.svg, .png, .jpg, .jpeg, .gif, .webp, .ico)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
