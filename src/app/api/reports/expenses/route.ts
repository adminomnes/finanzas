import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import type { ExpenseStatus } from "@prisma/client"

export async function GET(request: Request) {
  try {
    const user = await getSession()
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const companyId = searchParams.get("companyId")
    const categoryId = searchParams.get("categoryId")
    const groupBy = searchParams.get("groupBy") || "categoria"

    const where: Record<string, unknown> = {}
    if (companyId) where.companyId = companyId
    if (categoryId) where.categoryId = categoryId
    if (startDate || endDate) {
      where.date = {} as Record<string, Date>
      if (startDate) (where.date as Record<string, Date>).gte = new Date(startDate)
      if (endDate) (where.date as Record<string, Date>).lte = new Date(endDate + "T23:59:59.999Z")
    }

    const filteredExpenses = await prisma.expense.findMany({
      where: where as never,
      include: {
        company: { select: { id: true, name: true } },
        category: { select: { id: true, name: true, color: true } },
        supplier: { select: { id: true, name: true } },
        responsible: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { date: "desc" },
    })

    let grouped: Record<string, { total: number; count: number; label: string }> = {}

    if (groupBy === "categoria") {
      grouped = filteredExpenses.reduce(
        (acc, e) => {
          const key = e.categoryId
          const label = e.category.name
          if (!acc[key]) acc[key] = { total: 0, count: 0, label }
          acc[key].total += e.totalAmount
          acc[key].count++
          return acc
        },
        {} as Record<string, { total: number; count: number; label: string }>,
      )
    } else if (groupBy === "empresa") {
      grouped = filteredExpenses.reduce(
        (acc, e) => {
          const key = e.companyId
          const label = e.company.name
          if (!acc[key]) acc[key] = { total: 0, count: 0, label }
          acc[key].total += e.totalAmount
          acc[key].count++
          return acc
        },
        {} as Record<string, { total: number; count: number; label: string }>,
      )
    } else if (groupBy === "proveedor") {
      grouped = filteredExpenses.reduce(
        (acc, e) => {
          const key = e.supplierId
          const label = e.supplier.name
          if (!acc[key]) acc[key] = { total: 0, count: 0, label }
          acc[key].total += e.totalAmount
          acc[key].count++
          return acc
        },
        {} as Record<string, { total: number; count: number; label: string }>,
      )
    } else if (groupBy === "responsable") {
      grouped = filteredExpenses.reduce(
        (acc, e) => {
          const key = e.responsibleId
          const label = `${e.responsible.firstName} ${e.responsible.lastName}`
          if (!acc[key]) acc[key] = { total: 0, count: 0, label }
          acc[key].total += e.totalAmount
          acc[key].count++
          return acc
        },
        {} as Record<string, { total: number; count: number; label: string }>,
      )
    } else if (groupBy === "periodo") {
      const monthLabels = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
      ]
      grouped = filteredExpenses.reduce(
        (acc, e) => {
          const d = new Date(e.date)
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
          const label = `${monthLabels[d.getMonth()]} ${d.getFullYear()}`
          if (!acc[key]) acc[key] = { total: 0, count: 0, label }
          acc[key].total += e.totalAmount
          acc[key].count++
          return acc
        },
        {} as Record<string, { total: number; count: number; label: string }>,
      )
    }

    const groupedArray = Object.values(grouped).sort((a, b) => b.total - a.total)

    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.totalAmount, 0)

    const topExpenses = filteredExpenses
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10)
      .map((e) => ({
        id: e.id,
        code: e.code,
        date: e.date,
        description: e.description,
        supplier: e.supplier.name,
        totalAmount: e.totalAmount,
        status: e.status,
      }))

    const expenseByStatus = filteredExpenses.reduce(
      (acc, e) => {
        const s = e.status
        if (!acc[s]) acc[s] = { status: s, count: 0, total: 0 }
        acc[s].count++
        acc[s].total += e.totalAmount
        return acc
      },
      {} as Record<string, { status: ExpenseStatus; count: number; total: number }>,
    )

    return NextResponse.json({
      data: {
        grouped: groupedArray,
        totalExpenses,
        topExpenses,
        expenseByStatus: Object.values(expenseByStatus),
      },
    })
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") return NextResponse.json({ error: "No autenticado" }, { status: 401 })
      if (error.message === "Forbidden") return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
