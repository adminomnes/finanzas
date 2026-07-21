import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession, requireRole } from "@/lib/auth"
import { createAuditLog } from "@/lib/audit"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getSession()
    const { id } = await params

    const income = await prisma.income.findUnique({
      where: { id },
      include: {
        company: true,
        category: true,
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    })

    if (!income) {
      return NextResponse.json({ error: "Ingreso no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ data: income })
  } catch {
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole("SUPER_ADMIN", "ADMIN")
    const { id } = await params
    const body = await request.json()

    const existing = await prisma.income.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Ingreso no encontrado" }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    const fields = ["date", "companyId", "categoryId", "description", "netAmount", "taxAmount", "totalAmount", "paymentMethod", "status", "notes"]
    for (const field of fields) {
      if (body[field] !== undefined) {
        updateData[field] = field === "date" ? new Date(body[field]) : ["netAmount", "taxAmount", "totalAmount"].includes(field) ? parseFloat(body[field]) : body[field]
      }
    }

    const updated = await prisma.income.update({ where: { id }, data: updateData })

    await createAuditLog({
      userId: user.id,
      action: "UPDATE",
      entity: "Income",
      entityId: id,
      description: `Ingreso actualizado: ${existing.description}`,
      oldValue: existing,
      newValue: updateData,
    })

    return NextResponse.json({ data: updated })
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") return NextResponse.json({ error: "No autenticado" }, { status: 401 })
      if (error.message === "Forbidden") return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole("SUPER_ADMIN", "ADMIN")
    const { id } = await params

    const existing = await prisma.income.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Ingreso no encontrado" }, { status: 404 })
    }

    await prisma.income.delete({ where: { id } })

    await createAuditLog({
      userId: user.id,
      action: "DELETE",
      entity: "Income",
      entityId: id,
      description: `Ingreso eliminado: ${existing.description}`,
      oldValue: existing,
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") return NextResponse.json({ error: "No autenticado" }, { status: 401 })
      if (error.message === "Forbidden") return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
