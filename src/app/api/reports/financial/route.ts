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
    const companyId = searchParams.get("companyId")

    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)
    const prevMonthStart = startOfMonth(subMonths(now, 1))
    const prevMonthEnd = endOfMonth(subMonths(now, 1))

    const calcIncome = (gte: Date, lte: Date) =>
      prisma.$transaction(async () => {
        const [invAgg, incAgg] = await Promise.all([
          prisma.invoice.aggregate({
            _sum: { totalAmount: true },
            where: { issueDate: { gte, lte }, status: { not: "ANULADA" }, ...(companyId ? { companyId } : {}) },
          }),
          prisma.income.aggregate({
            _sum: { totalAmount: true },
            where: { date: { gte, lte }, ...(companyId ? { companyId } : {}) },
          }),
        ])
        return (invAgg._sum.totalAmount || 0) + (incAgg._sum.totalAmount || 0)
      })

    const calcExpenses = (gte: Date, lte: Date) =>
      prisma.expense.aggregate({
        _sum: { totalAmount: true },
        where: { date: { gte, lte }, status: { in: ["APPROVED", "PAGADO"] }, ...(companyId ? { companyId } : {}) },
      }).then((r) => r._sum.totalAmount || 0)

    const [[totalIncome, totalExpenses], [previousMonthIncome, previousMonthExpenses]] = await Promise.all([
      Promise.all([calcIncome(monthStart, monthEnd), calcExpenses(monthStart, monthEnd)]),
      Promise.all([calcIncome(prevMonthStart, prevMonthEnd), calcExpenses(prevMonthStart, prevMonthEnd)]),
    ])

    const netResult = totalIncome - totalExpenses
    const previousMonthResult = previousMonthIncome - previousMonthExpenses

    const calcVariation = (current: number, previous: number) =>
      previous !== 0 ? ((current - previous) / Math.abs(previous)) * 100 : 0

    const incomeVariation = calcVariation(totalIncome, previousMonthIncome)
    const expenseVariation = calcVariation(totalExpenses, previousMonthExpenses)
    const resultVariation = calcVariation(netResult, previousMonthResult)

    const monthlyCashFlow: { month: string; income: number; expenses: number; balance: number }[] = []
    for (let i = 11; i >= 0; i--) {
      const d = subMonths(now, i)
      const start = startOfMonth(d)
      const end = endOfMonth(d)

      const [invAgg, incAgg, expAgg] = await Promise.all([
        prisma.invoice.aggregate({
          _sum: { totalAmount: true },
          where: { issueDate: { gte: start, lte: end }, status: "PAGADA", ...(companyId ? { companyId } : {}) },
        }),
        prisma.income.aggregate({
          _sum: { totalAmount: true },
          where: { date: { gte: start, lte: end }, status: "RECEIVED", ...(companyId ? { companyId } : {}) },
        }),
        prisma.expense.aggregate({
          _sum: { totalAmount: true },
          where: { date: { gte: start, lte: end }, status: { in: ["APPROVED", "PAGADO"] }, ...(companyId ? { companyId } : {}) },
        }),
      ])

      const mIncome = (invAgg._sum.totalAmount || 0) + (incAgg._sum.totalAmount || 0)
      const mExpenses = expAgg._sum.totalAmount || 0
      monthlyCashFlow.push({
        month: format(d, "MMM yyyy", { locale: es }),
        income: mIncome,
        expenses: mExpenses,
        balance: mIncome - mExpenses,
      })
    }

    const auditLogs = await prisma.auditLog.findMany({
      where: { module: { in: ["FINANZAS", "FACTURACION", "COBRANZA"] } },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    const recentActivity = auditLogs.map((l) => ({
      id: l.id,
      action: l.action,
      module: l.module,
      entity: l.entity,
      entityId: l.entityId,
      description: l.description,
      createdAt: l.createdAt,
      user: l.user,
    }))

    return NextResponse.json({
      data: {
        totalIncome,
        totalExpenses,
        netResult,
        previousMonthIncome,
        previousMonthExpenses,
        previousMonthResult,
        incomeVariation,
        expenseVariation,
        resultVariation,
        monthlyCashFlow,
        recentActivity,
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
