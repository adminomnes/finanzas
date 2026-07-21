import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/auth"

export async function GET() {
  try {
    await requirePermission("expenses.view")
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfYear = new Date(now.getFullYear(), 0, 1)

    const [
      totalMonth,
      pendingCount,
      approvedCount,
      rejectedCount,
      totalCount,
      categoryTotals,
      companyTotals,
      responsibleTotals,
      monthlyTotals,
    ] = await Promise.all([
      prisma.expense.aggregate({ where: { date: { gte: startOfMonth } }, _sum: { totalAmount: true } }),
      prisma.expense.count({ where: { status: "PENDING" } }),
      prisma.expense.count({ where: { status: "APPROVED" } }),
      prisma.expense.count({ where: { status: "REJECTED" } }),
      prisma.expense.count(),
      prisma.expense.groupBy({
        by: ["categoryId"],
        _sum: { totalAmount: true },
        orderBy: { _sum: { totalAmount: "desc" } },
        take: 10,
      }),
      prisma.expense.groupBy({
        by: ["companyId"],
        _sum: { totalAmount: true },
        orderBy: { _sum: { totalAmount: "desc" } },
        take: 10,
      }),
      prisma.expense.groupBy({
        by: ["responsibleId"],
        _sum: { totalAmount: true },
        _count: true,
        orderBy: { _sum: { totalAmount: "desc" } },
        take: 10,
      }),
      (async () => {
        const months: { month: string; total: number; count: number }[] = []
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
          const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
          const agg = await prisma.expense.aggregate({
            where: { date: { gte: d, lte: end } },
            _sum: { totalAmount: true },
            _count: true,
          })
          months.push({
            month: d.toLocaleDateString("es-CL", { month: "short", year: "2-digit" }),
            total: agg._sum.totalAmount || 0,
            count: agg._count,
          })
        }
        return months
      })(),
    ])

    const categoryNames = await Promise.all(
      categoryTotals.map(async (c) => {
        const cat = await prisma.category.findUnique({ where: { id: c.categoryId } })
        return { name: cat?.name || "Sin categoría", total: c._sum.totalAmount || 0 }
      })
    )

    const companyNames = await Promise.all(
      companyTotals.map(async (c) => {
        const comp = await prisma.company.findUnique({ where: { id: c.companyId } })
        return { name: comp?.name || "Sin empresa", total: c._sum.totalAmount || 0 }
      })
    )

    const responsibleNames = await Promise.all(
      responsibleTotals.map(async (r) => {
        const usr = await prisma.user.findUnique({ where: { id: r.responsibleId } })
        return { name: usr ? `${usr.firstName} ${usr.lastName}` : "Sin responsable", total: r._sum.totalAmount || 0, count: r._count }
      })
    )

    const average = totalCount > 0 ? (await prisma.expense.aggregate({ _avg: { totalAmount: true } }))._avg.totalAmount || 0 : 0

    return NextResponse.json({
      totalMonth: totalMonth._sum.totalAmount || 0,
      pendingExpenses: pendingCount,
      approvedExpenses: approvedCount,
      rejectedExpenses: rejectedCount,
      totalExpenses: totalCount,
      averageAmount: average,
      topCategory: categoryNames[0] || null,
      categories: categoryNames,
      companies: companyNames,
      responsible: responsibleNames,
      monthlyTrend: monthlyTotals,
    })
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") return NextResponse.json({ error: "No autenticado" }, { status: 401 })
      if (error.message === "Forbidden") return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
