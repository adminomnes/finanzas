import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword, verifyPassword, getSession, validatePassword } from "@/lib/auth"
import { createAuditLog } from "@/lib/audit"

export async function POST(request: Request) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 }
      )
    }

    const passwordError = validatePassword(newPassword)
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    })

    if (!dbUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    const isValid = await verifyPassword(currentPassword, dbUser.passwordHash)
    if (!isValid) {
      return NextResponse.json(
        { error: "La contraseña actual es incorrecta" },
        { status: 400 }
      )
    }

    const passwordHash = await hashPassword(newPassword)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        mustChangePwd: false,
      },
    })

    await createAuditLog({
      userId: user.id,
      action: "PASSWORD_CHANGE",
      entity: "User",
      entityId: user.id,
      description: "Cambio de contraseña",
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
