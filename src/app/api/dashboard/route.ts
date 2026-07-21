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

    const [totalIncomeResult, totalExpensesResult, pendingExpensesCount] =
      await Promise.all([
        prisma.income.aggregate({
          _sum: { totalAmount: true },
          where: { status: "RECEIVED" },
        }),
        prisma.expense.aggregate({
          _sum: { totalAmount: true },
          where: { status: "APPROVED" },
        }),
        prisma.expense.count({ where: { status: "PENDING" } }),
      ])

    const totalIncome = totalIncomeResult._sum.totalAmount || 0
    const totalExpenses = totalExpensesResult._sum.totalAmount || 0
    const netResult = totalIncome - totalExpenses

    const monthlyData = []
    for (let i = months - 1; i >= 0; i--) {
      const date = subMonths(now, i)
      const start = startOfMonth(date)
      const end = endOfMonth(date)

      const [monthIncome, monthExpenses] = await Promise.all([
        prisma.income.aggregate({
          _sum: { totalAmount: true },
          where: {
            status: "RECEIVED",
            date: { gte: start, lte: end },
          },
        }),
        prisma.expense.aggregate({
          _sum: { totalAmount: true },
          where: {
            status: "APPROVED",
            date: { gte: start, lte: end },
          },
        }),
      ])

      monthlyData.push({
        month: format(date, "MMM", { locale: es }),
        income: monthIncome._sum.totalAmount || 0,
        expenses: monthExpenses._sum.totalAmount || 0,
      })
    }

    const expensesByCategory = await prisma.expense.groupBy({
      by: ["categoryId"],
      _sum: { totalAmount: true },
      where: {
        status: "APPROVED",
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

    const recentIncome = await prisma.income.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { name: true } },
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
      ...recentIncome.map((i) => ({
        id: i.id,
        date: i.date,
        type: "INCOME" as const,
        description: i.description,
        amount: i.totalAmount,
        category: i.category.name,
        status: i.status,
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10)

    return NextResponse.json({
      totalIncome,
      totalExpenses,
      netResult,
      cashFlow: totalIncome - totalExpenses,
      incomeCount: 0,
      expenseCount: 0,
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
