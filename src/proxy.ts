import { NextResponse, type NextRequest } from "next/server"
import { jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret")

interface JWTPayload {
  userId: string
  email: string
  role: string
  sessionId: string
}

const publicPaths = ["/login", "/forgot-password", "/reset-password"]

const routePermissions: Record<string, string[]> = {
  "/users": ["users.read"],
  "/audit": ["audit.read"],
  "/auditoria": ["audit.view"],
  "/settings": ["settings.read"],
  "/expenses": ["expenses.read"],
  "/income": ["income.read"],
  "/ingresos": ["income.view"],
  "/suppliers": ["suppliers.read"],
  "/categories": ["categories.read"],
  "/cost-centers": ["cost-centers.read"],
  "/companies": ["companies.read"],
  "/reports": ["reports.read"],
  "/admin/development": [],
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  if (pathname === "/" || pathname === "") {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  if (pathname.startsWith("/_next/") || pathname.includes(".")) {
    return NextResponse.next()
  }

  const token = request.cookies.get("session")?.value

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    const data = payload as unknown as JWTPayload

    const matchedRoute = Object.entries(routePermissions).find(([route]) =>
      pathname.startsWith(route)
    )

    if (matchedRoute && data.role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    return NextResponse.next()
  } catch {
    const response = NextResponse.redirect(new URL("/login", request.url))
    response.cookies.delete("session")
    return response
  }
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
