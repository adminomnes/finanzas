import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession, requireRole } from "@/lib/auth"
import { createAuditLog } from "@/lib/audit"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole("SUPER_ADMIN", "ADMIN")
    const { id } = await params
    const body = await request.json()

    const existing = await prisma.supplier.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: "Proveedor no encontrado" }, { status: 404 })

    const updated = await prisma.supplier.update({ where: { id }, data: body })

    await createAuditLog({
      userId: user.id,
      action: "UPDATE",
      entity: "Supplier",
      entityId: id,
      description: `Proveedor actualizado: ${existing.name}`,
      oldValue: existing,
      newValue: body,
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
    const user = await requireRole("SUPER_ADMIN")
    const { id } = await params

    const existing = await prisma.supplier.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: "Proveedor no encontrado" }, { status: 404 })

    await prisma.supplier.update({ where: { id }, data: { isActive: false } })

    await createAuditLog({
      userId: user.id,
      action: "DELETE",
      entity: "Supplier",
      entityId: id,
      description: `Proveedor desactivado: ${existing.name}`,
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
