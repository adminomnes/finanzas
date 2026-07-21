import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth"
import { createAuditLog } from "@/lib/audit"

export async function GET() {
  try {
    await requireRole("SUPER_ADMIN", "ADMIN")

    const settings = await prisma.setting.findMany({
      orderBy: [{ group: "asc" }, { key: "asc" }],
    })

    return NextResponse.json({ data: settings })
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") return NextResponse.json({ error: "No autenticado" }, { status: 401 })
      if (error.message === "Forbidden") return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireRole("SUPER_ADMIN", "ADMIN")
    const body = await request.json()

    const updated: { key: string; value: string }[] = []

    for (const [key, value] of Object.entries(body)) {
      const existing = await prisma.setting.findUnique({ where: { key } })
      if (existing) {
        await prisma.setting.update({ where: { key }, data: { value: String(value) } })
      } else {
        await prisma.setting.create({ data: { key, value: String(value), group: "GENERAL" } })
      }
      updated.push({ key, value: String(value) })
    }

    await createAuditLog({
      userId: user.id,
      action: "UPDATE",
      entity: "Setting",
      description: "Configuración del sistema actualizada",
      newValue: body,
    })

    return NextResponse.json({ data: updated })
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") return NextResponse.json({ error: "No autenticado" }, { status: 401 })
      if (error.message === "Forbidden") return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
