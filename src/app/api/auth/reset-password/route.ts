import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword, validatePassword } from "@/lib/auth"
import { createAuditLog } from "@/lib/audit"

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token y nueva contraseña son requeridos" },
        { status: 400 }
      )
    }

    const passwordError = validatePassword(password)
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 })
    }

    const resetRequest = await prisma.passwordReset.findUnique({
      where: { token },
    })

    if (!resetRequest) {
      return NextResponse.json(
        { error: "Token inválido o expirado" },
        { status: 400 }
      )
    }

    if (resetRequest.usedAt) {
      return NextResponse.json(
        { error: "Este enlace ya ha sido utilizado" },
        { status: 400 }
      )
    }

    if (resetRequest.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "El enlace ha expirado. Solicite uno nuevo." },
        { status: 400 }
      )
    }

    const passwordHash = await hashPassword(password)

    await prisma.user.update({
      where: { id: resetRequest.userId },
      data: {
        passwordHash,
        mustChangePwd: false,
        isLocked: false,
        lockedUntil: null,
        failedAttempts: 0,
      },
    })

    await prisma.passwordReset.update({
      where: { id: resetRequest.id },
      data: { usedAt: new Date() },
    })

    await prisma.session.updateMany({
      where: { userId: resetRequest.userId, isActive: true },
      data: { isActive: false },
    })

    await createAuditLog({
      userId: resetRequest.userId,
      action: "PASSWORD_RESET",
      entity: "User",
      entityId: resetRequest.userId,
      description: "Contraseña restablecida mediante token de recuperación",
    })

    return NextResponse.json({
      success: true,
      message: "Contraseña restablecida exitosamente",
    })
  } catch {
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
