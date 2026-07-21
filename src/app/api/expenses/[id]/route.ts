import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession, requireRole } from "@/lib/auth"
import { createAuditLog } from "@/lib/audit"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await getSession()
    const { id } = await params
    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        company: true,
        supplier: true,
        category: true,
        costCenter: true,
        responsible: { select: { id: true, firstName: true, lastName: true, email: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        statusHistory: { orderBy: { createdAt: "desc" }, include: { changedBy: { select: { id: true, firstName: true, lastName: true } } } },
        documents: { orderBy: { uploadedAt: "desc" }, include: { uploadedBy: { select: { id: true, firstName: true, lastName: true } } } },
        attachments: true,
      },
    })
    if (!expense) return NextResponse.json({ error: "Gasto no encontrado" }, { status: 404 })
    return NextResponse.json({ data: expense })
  } catch { return NextResponse.json({ error: "Error interno" }, { status: 500 }) }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole("SUPER_ADMIN", "ADMIN")
    const { id } = await params
    const body = await request.json()

    const existing = await prisma.expense.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: "Gasto no encontrado" }, { status: 404 })

    if (body.status && body.status !== existing.status) {
      const validTransitions: Record<string, string[]> = {
        DRAFT: ["PENDING"],
        PENDING: ["APPROVED", "REJECTED", "CANCELLED"],
        APPROVED: ["CANCELLED"],
        REJECTED: [],
        CANCELLED: [],
      }
      if (!validTransitions[existing.status]?.includes(body.status)) {
        return NextResponse.json({ error: `No se puede cambiar de ${existing.status} a ${body.status}` }, { status: 400 })
      }

      await prisma.expense.update({ where: { id }, data: { status: body.status } })

      await prisma.expenseStatusHistory.create({
        data: {
          expenseId: id,
          previousStatus: existing.status,
          newStatus: body.status,
          changedById: user.id,
          comment: body.comment || `Cambio de estado: ${existing.status} → ${body.status}`,
        },
      })

      await createAuditLog({
        userId: user.id,
        action: body.status === "APPROVED" ? "APPROVE" : body.status === "REJECTED" ? "REJECT" : "UPDATE",
        entity: "Expense",
        entityId: id,
        description: `Gasto ${existing.code}: ${existing.status} → ${body.status}`,
        oldValue: { status: existing.status },
        newValue: { status: body.status, comment: body.comment },
      })

      return NextResponse.json({ success: true, message: `Estado cambiado a ${body.status}` })
    }

    if (existing.status === "APPROVED" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "No puedes modificar un gasto aprobado" }, { status: 403 })
    }

    const allowedFields = [
      "date", "companyId", "supplierId", "documentType", "documentNumber", "documentDate",
      "categoryId", "costCenterId", "description", "netAmount", "taxAmount", "totalAmount",
      "currency", "paymentMethod", "account", "area", "responsibleId", "notes",
    ]
    const updateData: Record<string, unknown> = {}

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = field === "date" || field === "documentDate" ? new Date(body[field]) :
          ["netAmount", "taxAmount", "totalAmount"].includes(field) ? parseFloat(body[field]) : body[field]
      }
    }

    if (updateData.netAmount !== undefined || updateData.taxAmount !== undefined) {
      const net = (updateData.netAmount as number) ?? existing.netAmount
      const tax = (updateData.taxAmount as number) ?? existing.taxAmount
      updateData.totalAmount = net + tax
    }

    const updated = await prisma.expense.update({
      where: { id }, data: updateData,
      include: {
        company: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
        category: { select: { id: true, name: true, color: true } },
        costCenter: { select: { id: true, name: true, code: true } },
      },
    })

    await createAuditLog({
      userId: user.id, action: "UPDATE", entity: "Expense", entityId: id,
      description: `Gasto ${existing.code} actualizado`,
      oldValue: existing, newValue: updateData,
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

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole("SUPER_ADMIN", "ADMIN")
    const { id } = await params
    const existing = await prisma.expense.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: "Gasto no encontrado" }, { status: 404 })

    await prisma.expense.update({ where: { id }, data: { status: "CANCELLED" } })

    await prisma.expenseStatusHistory.create({
      data: { expenseId: id, previousStatus: existing.status, newStatus: "CANCELLED", changedById: user.id, comment: "Gasto anulado" },
    })

    await createAuditLog({
      userId: user.id, action: "DELETE", entity: "Expense", entityId: id,
      description: `Gasto ${existing.code} anulado: ${existing.description}`,
      oldValue: existing,
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") return NextResponse.json({ error: "No autenticado" }, { status: 401 })
      if (error.message === "Forbidden") return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
