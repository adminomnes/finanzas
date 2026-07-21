import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword, getSession, requireRole } from "@/lib/auth"
import { createAuditLog } from "@/lib/audit"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole("SUPER_ADMIN", "ADMIN")
    const { id } = await params

    const targetUser = await prisma.user.findUnique({ where: { id } })
    if (!targetUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    if (user.role === "ADMIN" && targetUser.role !== "OPERATOR") {
      return NextResponse.json({ error: "No puedes restablecer contraseña de este usuario" }, { status: 403 })
    }

    const tempPassword = "Temp" + Math.random().toString(36).slice(2, 10) + "1!"
    const passwordHash = await hashPassword(tempPassword)

    await prisma.user.update({
      where: { id },
      data: {
        passwordHash,
        mustChangePwd: true,
        isLocked: false,
        lockedUntil: null,
        failedAttempts: 0,
      },
    })

    await prisma.session.updateMany({
      where: { userId: id, isActive: true },
      data: { isActive: false },
    })

    await createAuditLog({
      userId: user.id,
      action: "PASSWORD_CHANGE",
      entity: "User",
      entityId: id,
      description: `Contraseña restablecida para ${targetUser.email}`,
    })

    return NextResponse.json({
      success: true,
      tempPassword,
      message: "Contraseña restablecida exitosamente",
    })
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") return NextResponse.json({ error: "No autenticado" }, { status: 401 })
      if (error.message === "Forbidden") return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
