import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: "Email es requerido" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      return NextResponse.json({
        message:
          "Si el correo existe, recibirás instrucciones para restablecer tu contraseña.",
      })
    }

    const existingTokens = await prisma.passwordReset.findMany({
      where: { email, usedAt: null, expiresAt: { gte: new Date() } },
    })
    for (const t of existingTokens) {
      await prisma.passwordReset.update({
        where: { id: t.id },
        data: { expiresAt: new Date() },
      })
    }

    const token = uuidv4()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

    await prisma.passwordReset.create({
      data: { email, userId: user.id, token, expiresAt },
    })

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${token}`

    console.log(`[PASSWORD RESET] Email enviado a ${email}: ${resetUrl}`)

    return NextResponse.json({
      message:
        "Si el correo existe, recibirás instrucciones para restablecer tu contraseña.",
    })
  } catch {
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
