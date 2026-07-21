import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"
import { createAuditLog } from "@/lib/audit"

export async function POST() {
  try {
    const { cookies: cookieStore } = await import("next/headers")
    const cookie = await cookieStore()
    const token = cookie.get("session")?.value

    if (token) {
      const payload = verifyToken(token)
      if (payload) {
        await prisma.session.updateMany({
          where: { token: payload.sessionId },
          data: { isActive: false },
        })

        await createAuditLog({
          userId: payload.userId,
          action: "LOGOUT",
          entity: "User",
          entityId: payload.userId,
          description: "Cierre de sesión",
        })
      }
    }

    const response = NextResponse.json({ success: true })
    response.cookies.set("session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    })
    return response
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
