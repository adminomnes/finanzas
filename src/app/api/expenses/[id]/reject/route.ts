import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/auth"
import { createAuditLog } from "@/lib/audit"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission("expenses.reject")
    const { id } = await params
    const { comment } = await request.json()

    if (!comment || comment.trim() === "") {
      return NextResponse.json({ error: "Debe ingresar un motivo de rechazo" }, { status: 400 })
    }

    const existing = await prisma.expense.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: "Gasto no encontrado" }, { status: 404 })
    if (existing.status !== "PENDING") return NextResponse.json({ error: "Solo se pueden rechazar gastos pendientes" }, { status: 400 })

    await prisma.expense.update({ where: { id }, data: { status: "REJECTED" } })

    await prisma.expenseStatusHistory.create({
      data: { expenseId: id, previousStatus: "PENDING", newStatus: "REJECTED", changedById: user.id, comment },
    })

    await createAuditLog({
      userId: user.id, action: "REJECT", entity: "Expense", entityId: id,
      description: `Gasto ${existing.code} rechazado por ${user.firstName} ${user.lastName}: ${comment}`,
      newValue: { status: "REJECTED", comment, rejectedBy: user.id, rejectedAt: new Date().toISOString() },
    })

    return NextResponse.json({ success: true, message: "Gasto rechazado" })
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") return NextResponse.json({ error: "No autenticado" }, { status: 401 })
      if (error.message === "Forbidden") return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
