import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { createAuditLog } from "@/lib/audit"
import type { InvoiceStatus } from "@prisma/client"

const validTransitions: Record<string, InvoiceStatus[]> = {
  BORRADOR: ["EMITIDA"],
  EMITIDA: ["ENVIADA", "ANULADA"],
  ENVIADA: ["PENDIENTE_PAGO", "ANULADA"],
  PENDIENTE_PAGO: ["PAGADA", "VENCIDA", "ANULADA"],
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSession()
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    const { id } = await params
    const body = await request.json()
    const newStatus = body.status as InvoiceStatus
    const comment = body.comment || null

    const existing = await prisma.invoice.findUnique({
      where: { id },
      include: { items: true },
    })
    if (!existing) return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 })

    const allowed = validTransitions[existing.status]
    if (!allowed || !allowed.includes(newStatus)) {
      return NextResponse.json(
        { error: `Transición no válida de ${existing.status} a ${newStatus}` },
        { status: 400 }
      )
    }

    if (newStatus === "EMITIDA" && existing.items.length === 0) {
      return NextResponse.json({ error: "La factura debe tener al menos un item para ser emitida" }, { status: 400 })
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: { status: newStatus },
      include: {
        client: { select: { id: true, name: true } },
        items: true,
      },
    })

    await prisma.invoiceStatusHistory.create({
      data: {
        previousStatus: existing.status,
        newStatus,
        invoiceId: id,
        changedById: user.id,
        comment,
      },
    })

    await createAuditLog({
      userId: user.id,
      action: "UPDATE",
      entity: "Invoice",
      entityId: id,
      module: "FACTURACION",
      description: `Factura ${existing.number}: ${existing.status} → ${newStatus}`,
      oldValue: { status: existing.status },
      newValue: { status: newStatus },
    })

    return NextResponse.json({ data: updated })
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
