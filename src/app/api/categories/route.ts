import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession, requireRole } from "@/lib/auth"
import { createAuditLog } from "@/lib/audit"

export async function GET(request: Request) {
  try {
    await getSession()
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")

    const where: Record<string, unknown> = { isActive: true }
    if (type) where.type = type

    const categories = await prisma.category.findMany({
      where: where as never,
      orderBy: { name: "asc" },
    })

    return NextResponse.json({ data: categories })
  } catch {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole("SUPER_ADMIN", "ADMIN")
    const body = await request.json()

    const category = await prisma.category.create({
      data: {
        name: body.name,
        type: body.type || "EXPENSE",
        color: body.color || "#6366F1",
        icon: body.icon || "file-text",
      },
    })

    await createAuditLog({
      userId: user.id,
      action: "CREATE",
      entity: "Category",
      entityId: category.id,
      description: `Categoría creada: ${body.name} (${body.type || "EXPENSE"})`,
      newValue: body,
    })

    return NextResponse.json({ data: category }, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
