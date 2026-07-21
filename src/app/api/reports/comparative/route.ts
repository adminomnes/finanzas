import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns"
import { es } from "date-fns/locale"

export async function GET(request: Request) {
  try {
    const user = await getSession()
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const months = parseInt(searchParams.get("months") || "3")
    const companyId = searchParams.get("companyId")

    const now = new Date()
    const monthlyData: { month: string; income: number; expenses: number; result: number }[] = []

    for (let i = months - 1; i >= 0; i--) {
      const d = subMonths(now, i)
      const start = startOfMonth(d)
      const end = endOfMonth(d)
      const filter: Record<string, unknown> = {}
      if (companyId) filter.companyId = companyId

      const [invAgg, incAgg, expAgg] = await Promise.all([
        prisma.invoice.aggregate({
          _sum: { totalAmount: true },
          where: { issueDate: { gte: start, lte: end }, status: { not: "ANULADA" }, ...filter } as never,
        }),
        prisma.income.aggregate({
          _sum: { totalAmount: true },
          where: { date: { gte: start, lte: end }, status: "RECEIVED", ...filter } as never,
        }),
        prisma.expense.aggregate({
          _sum: { totalAmount: true },
          where: { date: { gte: start, lte: end }, status: { in: ["APPROVED", "PAGADO"] }, ...filter } as never,
        }),
      ])

      const income = (invAgg._sum.totalAmount || 0) + (incAgg._sum.totalAmount || 0)
      const expenses = expAgg._sum.totalAmount || 0
      monthlyData.push({
        month: format(d, "MMM yyyy", { locale: es }),
        income,
        expenses,
        result: income - expenses,
      })
    }

    const currentMonth = monthlyData[monthlyData.length - 1] || { month: "", income: 0, expenses: 0, result: 0 }
    const previousMonth = monthlyData[monthlyData.length - 2] || { month: "", income: 0, expenses: 0, result: 0 }

    const calcVariation = (current: number, previous: number) =>
      previous !== 0 ? ((current - previous) / Math.abs(previous)) * 100 : 0

    const variations = {
      income: calcVariation(currentMonth.income, previousMonth.income),
      expenses: calcVariation(currentMonth.expenses, previousMonth.expenses),
      result: calcVariation(currentMonth.result, previousMonth.result),
    }

    return NextResponse.json({
      data: { monthlyData, currentMonth, previousMonth, variations },
    })
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") return NextResponse.json({ error: "No autenticado" }, { status: 401 })
      if (error.message === "Forbidden") return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
