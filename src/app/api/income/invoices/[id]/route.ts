import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession, requireRole } from "@/lib/auth"
import { createAuditLog } from "@/lib/audit"
import type { InvoiceStatus } from "@prisma/client"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSession()
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    const { id } = await params

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        company: { select: { id: true, name: true, rut: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        items: true,
        payments: {
          include: { createdBy: { select: { firstName: true, lastName: true } } },
        },
        statusHistory: {
          orderBy: { createdAt: "desc" },
          include: { changedBy: { select: { firstName: true, lastName: true } } },
        },
      },
    })

    if (!invoice) return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 })
    return NextResponse.json({ data: invoice })
  } catch {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole("SUPER_ADMIN", "ADMIN")
    const { id } = await params
    const body = await request.json()

    const existing = await prisma.invoice.findUnique({ where: { id }, include: { items: true } })
    if (!existing) return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 })

    if (existing.status !== "BORRADOR" && existing.status !== "EMITIDA") {
      return NextResponse.json({ error: "No se puede modificar una factura en estado actual" }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    const fields = ["issueDate", "dueDate", "description", "notes", "clientId", "currency", "pdfUrl", "xmlUrl"]
    for (const f of fields) {
      if (body[f] !== undefined) updateData[f] = f.includes("Date") ? new Date(body[f]) : body[f]
    }

    if (body.items) {
      const items = body.items.map((item: { description: string; quantity: number; unitValue: number; discount?: number }) => ({
        description: item.description,
        quantity: item.quantity || 1,
        unitValue: item.unitValue || 0,
        discount: item.discount || 0,
        total: (item.quantity || 1) * (item.unitValue || 0) * (1 - (item.discount || 0) / 100),
      }))
      const netAmount = items.reduce((sum: number, item: { total: number }) => sum + item.total, 0)
      const taxAmount = netAmount * 0.19
      updateData.netAmount = netAmount
      updateData.taxAmount = taxAmount
      updateData.totalAmount = netAmount + taxAmount

      await prisma.invoiceItem.deleteMany({ where: { invoiceId: id } })
      updateData.items = { create: items }
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        client: { select: { id: true, name: true } },
        items: true,
      },
    })

    await createAuditLog({
      userId: user.id,
      action: "UPDATE",
      entity: "Invoice",
      entityId: id,
      module: "FACTURACION",
      description: `Factura actualizada: ${existing.number}`,
      oldValue: { status: existing.status, netAmount: existing.netAmount },
      newValue: { status: updated.status, netAmount: updated.netAmount },
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

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole("SUPER_ADMIN", "ADMIN")
    const { id } = await params

    const existing = await prisma.invoice.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 })

    if (existing.status === "PAGADA" || existing.status === "ANULADA") {
      return NextResponse.json({ error: "No se puede anular una factura pagada o ya anulada" }, { status: 400 })
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: { status: "ANULADA" as InvoiceStatus },
    })

    await prisma.invoiceStatusHistory.create({
      data: {
        previousStatus: existing.status,
        newStatus: "ANULADA",
        invoiceId: id,
        changedById: user.id,
        comment: "Factura anulada",
      },
    })

    await createAuditLog({
      userId: user.id,
      action: "DELETE",
      entity: "Invoice",
      entityId: id,
      module: "FACTURACION",
      description: `Factura anulada: ${existing.number}`,
      oldValue: { status: existing.status },
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
