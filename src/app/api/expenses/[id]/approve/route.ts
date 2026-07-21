import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/auth"
import { createAuditLog } from "@/lib/audit"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission("expenses.approve")
    const { id } = await params
    const { comment } = await request.json()

    const existing = await prisma.expense.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: "Gasto no encontrado" }, { status: 404 })
    if (existing.status !== "PENDING") return NextResponse.json({ error: "Solo se pueden aprobar gastos pendientes" }, { status: 400 })

    await prisma.expense.update({ where: { id }, data: { status: "APPROVED" } })

    await prisma.expenseStatusHistory.create({
      data: { expenseId: id, previousStatus: "PENDING", newStatus: "APPROVED", changedById: user.id, comment: comment || "Aprobado" },
    })

    await createAuditLog({
      userId: user.id, action: "APPROVE", entity: "Expense", entityId: id,
      description: `Gasto ${existing.code} aprobado por ${user.firstName} ${user.lastName}`,
      newValue: { status: "APPROVED", comment, approvedBy: user.id, approvedAt: new Date().toISOString() },
    })

    return NextResponse.json({ success: true, message: "Gasto aprobado correctamente" })
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") return NextResponse.json({ error: "No autenticado" }, { status: 401 })
      if (error.message === "Forbidden") return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
