import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession, requireRole } from "@/lib/auth"
import { createAuditLog } from "@/lib/audit"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { id } = await params

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        invoices: {
          orderBy: { createdAt: "desc" },
          include: {
            items: true,
            payments: true,
            statusHistory: { orderBy: { createdAt: "desc" } },
          },
        },
        _count: { select: { invoices: true } },
      },
    })

    if (!client) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }

    const paymentCount = await prisma.payment.count({
      where: { invoice: { clientId: id } },
    })

    const result = await prisma.invoice.aggregate({
      where: { clientId: id, status: { not: "ANULADA" } },
      _sum: { totalAmount: true },
    })

    return NextResponse.json({
      data: {
        ...client,
        _count: { ...client._count, payments: paymentCount },
        totalInvoiced: result._sum.totalAmount || 0,
      },
    })
  } catch {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
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

    const existing = await prisma.client.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }

    if (body.rut && body.rut !== existing.rut) {
      const duplicate = await prisma.client.findUnique({ where: { rut: body.rut } })
      if (duplicate) {
        return NextResponse.json({ error: "El RUT ya está registrado" }, { status: 409 })
      }
    }

    const updateData: Record<string, unknown> = {}
    const fields = ["name", "rut", "type", "address", "phone", "email", "contactName", "paymentTerms", "isActive"]
    for (const field of fields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    const updated = await prisma.client.update({ where: { id }, data: updateData })

    await createAuditLog({
      userId: user.id,
      action: "UPDATE",
      module: "CLIENTES",
      entity: "Client",
      entityId: id,
      description: `Cliente actualizado: ${existing.name}`,
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
    const user = await requireRole("SUPER_ADMIN")
    const { id } = await params

    const existing = await prisma.client.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }

    if (!existing.isActive) {
      return NextResponse.json({ error: "El cliente ya está desactivado" }, { status: 400 })
    }

    await prisma.client.update({ where: { id }, data: { isActive: false } })

    await createAuditLog({
      userId: user.id,
      action: "DELETE",
      module: "CLIENTES",
      entity: "Client",
      entityId: id,
      description: `Cliente desactivado: ${existing.name}`,
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
