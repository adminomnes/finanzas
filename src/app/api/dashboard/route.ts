import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns"
import { es } from "date-fns/locale"

export async function GET(request: Request) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const months = parseInt(searchParams.get("months") || "6")

    const now = new Date()

    const [
      totalSimpleIncomeResult,
      totalInvoiceIncomeResult,
      totalExpensesResult,
      pendingExpensesCount,
      simpleIncomeCount,
      invoiceCount,
      expenseCount,
    ] = await Promise.all([
      prisma.income.aggregate({
        _sum: { totalAmount: true },
        where: { status: "RECEIVED" },
      }),
      prisma.invoice.aggregate({
        _sum: { totalAmount: true },
        where: { status: { not: "ANULADA" } },
      }),
      prisma.expense.aggregate({
        _sum: { totalAmount: true },
        where: { status: { in: ["APPROVED", "PAGADO"] } },
      }),
      prisma.expense.count({ where: { status: "PENDING" } }),
      prisma.income.count({ where: { status: "RECEIVED" } }),
      prisma.invoice.count({ where: { status: { not: "ANULADA" } } }),
      prisma.expense.count({ where: { status: { not: "CANCELLED" } } }),
    ])

    const totalIncome = (totalSimpleIncomeResult._sum.totalAmount || 0) + (totalInvoiceIncomeResult._sum.totalAmount || 0)
    const totalExpenses = totalExpensesResult._sum.totalAmount || 0
    const netResult = totalIncome - totalExpenses

    const monthlyData = []
    for (let i = months - 1; i >= 0; i--) {
      const date = subMonths(now, i)
      const start = startOfMonth(date)
      const end = endOfMonth(date)

      const [monthSimpleIncome, monthInvoiceIncome, monthExpenses] = await Promise.all([
        prisma.income.aggregate({
          _sum: { totalAmount: true },
          where: {
            status: "RECEIVED",
            date: { gte: start, lte: end },
          },
        }),
        prisma.invoice.aggregate({
          _sum: { totalAmount: true },
          where: {
            status: { not: "ANULADA" },
            date: { gte: start, lte: end },
          },
        }),
        prisma.expense.aggregate({
          _sum: { totalAmount: true },
          where: {
            status: { in: ["APPROVED", "PAGADO"] },
            date: { gte: start, lte: end },
          },
        }),
      ])

      monthlyData.push({
        month: format(date, "MMM", { locale: es }),
        income: (monthSimpleIncome._sum.totalAmount || 0) + (monthInvoiceIncome._sum.totalAmount || 0),
        expenses: monthExpenses._sum.totalAmount || 0,
      })
    }

    const expensesByCategory = await prisma.expense.groupBy({
      by: ["categoryId"],
      _sum: { totalAmount: true },
      where: {
        status: { in: ["APPROVED", "PAGADO"] },
        date: {
          gte: startOfMonth(subMonths(now, 2)),
          lte: endOfMonth(now),
        },
      },
    })

    const categoryIds = expensesByCategory.map((e) => e.categoryId)
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
    })

    const categoryMap = new Map(categories.map((c) => [c.id, c]))

    const expensesByCategoryData = expensesByCategory
      .map((e) => ({
        category: categoryMap.get(e.categoryId)?.name || "Sin categoría",
        amount: e._sum.totalAmount || 0,
        color: categoryMap.get(e.categoryId)?.color || "#94A3B8",
      }))
      .sort((a, b) => b.amount - a.amount)

    const recentExpenses = await prisma.expense.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { name: true } },
      },
    })

    const recentSimpleIncome = await prisma.income.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { name: true } },
      },
    })

    const recentInvoices = await prisma.invoice.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { name: true } },
      },
    })

    const recentMovements = [
      ...recentExpenses.map((e) => ({
        id: e.id,
        date: e.date,
        type: "EXPENSE" as const,
        description: e.description,
        amount: e.totalAmount,
        category: e.category.name,
        status: e.status,
      })),
      ...recentSimpleIncome.map((i) => ({
        id: i.id,
        date: i.date,
        type: "INCOME" as const,
        description: i.description,
        amount: i.totalAmount,
        category: i.category.name,
        status: i.status,
      })),
      ...recentInvoices.map((inv) => ({
        id: inv.id,
        date: inv.date,
        type: "INCOME" as const,
        description: `Factura ${inv.number} - ${inv.client.name}`,
        amount: inv.totalAmount,
        category: "Facturación",
        status: inv.status,
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 15)

    return NextResponse.json({
      totalIncome,
      totalExpenses,
      netResult,
      cashFlow: totalIncome - totalExpenses,
      incomeCount: simpleIncomeCount + invoiceCount,
      expenseCount,
      pendingExpenses: pendingExpensesCount,
      monthlyExpenses: monthlyData,
      expensesByCategory: expensesByCategoryData,
      recentMovements,
    })
  } catch {
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
