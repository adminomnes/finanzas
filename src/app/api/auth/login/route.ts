import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyPassword, signToken, checkBruteForce, recordLoginAttempt, createSession } from "@/lib/auth"
import { createAuditLog } from "@/lib/audit"

export async function POST(request: Request) {
  try {
    const { email, password, rememberMe } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y contraseña son requeridos" },
        { status: 400 }
      )
    }

    const bruteForceCheck = await checkBruteForce(email)
    if (bruteForceCheck.blocked) {
      return NextResponse.json(
        {
          error: `Demasiados intentos fallidos. Intente nuevamente en ${bruteForceCheck.remainingMinutes} minutos.`,
        },
        { status: 429 }
      )
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      await recordLoginAttempt(email, false)
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      )
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: "Usuario desactivado. Contacte al administrador" },
        { status: 403 }
      )
    }

    if (user.isLocked && user.lockedUntil && user.lockedUntil > new Date()) {
      const remaining = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / 60000
      )
      return NextResponse.json(
        {
          error: `Cuenta bloqueada temporalmente. Intente nuevamente en ${remaining} minutos.`,
        },
        { status: 423 }
      )
    }

    const isValid = await verifyPassword(password, user.passwordHash)

    if (!isValid) {
      await recordLoginAttempt(email, false, user.id)
      await createAuditLog({
        userId: user.id,
        action: "LOGIN_FAILED",
        entity: "User",
        entityId: user.id,
        description: `Intento fallido de inicio de sesión para ${email}`,
      })
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      )
    }

    if (user.isLocked) {
      await prisma.user.update({
        where: { id: user.id },
        data: { isLocked: false, lockedUntil: null, failedAttempts: 0 },
      })
    }

    const sessionToken = await createSession(user.id, !!rememberMe)

    const jwtToken = await signToken(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        sessionId: sessionToken,
      },
      !!rememberMe
    )

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date(), failedAttempts: 0 },
    })

    await recordLoginAttempt(email, true, user.id)

    await createAuditLog({
      userId: user.id,
      action: "LOGIN",
      entity: "User",
      entityId: user.id,
      description: `Inicio de sesión exitoso - ${user.email}`,
    })

    const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 8

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        mustChangePwd: user.mustChangePwd,
      },
      mustChangePwd: user.mustChangePwd,
    })

    response.cookies.set("session", jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge,
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
