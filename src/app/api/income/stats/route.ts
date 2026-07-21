import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import type { InvoiceStatus } from "@/types/prisma-enums"

export async function GET() {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfYear = new Date(now.getFullYear(), 0, 1)
    const pendingStatuses: InvoiceStatus[] = ["EMITIDA", "ENVIADA", "PENDIENTE_PAGO"]

    const [
      totalInvoicedMonth,
      totalInvoicedYear,
      pendingInvoices,
      overdueInvoices,
      pendingAmount,
      overdueAmount,
      totalCollectedMonth,
      totalCollectedYear,
      clientsWithDebt,
      topClientsRaw,
      recentActivity,
    ] = await Promise.all([
      prisma.invoice.aggregate({
        where: { issueDate: { gte: startOfMonth }, status: { not: "ANULADA" as InvoiceStatus as InvoiceStatus } },
        _sum: { totalAmount: true },
      }),
      prisma.invoice.aggregate({
        where: { issueDate: { gte: startOfYear }, status: { not: "ANULADA" as InvoiceStatus as InvoiceStatus } },
        _sum: { totalAmount: true },
      }),
      prisma.invoice.count({
        where: { status: { in: pendingStatuses } },
      }),
      prisma.invoice.count({
        where: { status: { in: pendingStatuses }, dueDate: { lt: now } },
      }),
      prisma.invoice.aggregate({
        where: { status: { in: pendingStatuses } },
        _sum: { totalAmount: true },
      }),
      prisma.invoice.aggregate({
        where: { status: { in: pendingStatuses }, dueDate: { lt: now } },
        _sum: { totalAmount: true },
      }),
      prisma.payment.aggregate({
        where: { date: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { date: { gte: startOfYear } },
        _sum: { amount: true },
      }),
      prisma.invoice.groupBy({
        by: ["clientId"],
        where: { status: { in: pendingStatuses } },
        _count: { id: true },
      }),
      prisma.invoice.groupBy({
        by: ["clientId"],
        where: { issueDate: { gte: startOfYear }, status: { not: "ANULADA" as InvoiceStatus } },
        _sum: { totalAmount: true },
        orderBy: { _sum: { totalAmount: "desc" } },
        take: 5,
      }),
      prisma.invoiceStatusHistory.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          changedBy: { select: { firstName: true, lastName: true } },
          invoice: { select: { number: true } },
        },
      }),
    ])

    const monthlyInvoices = await (async () => {
      const months: { month: string; count: number; totalAmount: number }[] = []
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
        const agg = await prisma.invoice.aggregate({
          where: {
            issueDate: { gte: d, lte: end },
            status: { not: "ANULADA" as InvoiceStatus },
          },
          _sum: { totalAmount: true },
          _count: true,
        })
        months.push({
          month: d.toLocaleDateString("es-CL", { month: "short", year: "2-digit" }),
          count: agg._count,
          totalAmount: agg._sum.totalAmount || 0,
        })
      }
      return months
    })()

    const clientIds = topClientsRaw.map((c) => c.clientId)
    const clients = await prisma.client.findMany({
      where: { id: { in: clientIds } },
      select: { id: true, name: true, rut: true },
    })
    const clientMap = new Map(clients.map((c) => [c.id, c]))
    const topClients = topClientsRaw.map((c) => ({
      client: clientMap.get(c.clientId) || { id: c.clientId, name: "Desconocido", rut: "" },
      totalInvoiced: c._sum.totalAmount || 0,
    }))

    return NextResponse.json({
      data: {
        totalInvoicedMonth: totalInvoicedMonth._sum.totalAmount || 0,
        totalInvoicedYear: totalInvoicedYear._sum.totalAmount || 0,
        pendingInvoices,
        overdueInvoices,
        totalPendingAmount: pendingAmount._sum.totalAmount || 0,
        totalOverdueAmount: overdueAmount._sum.totalAmount || 0,
        totalCollectedMonth: totalCollectedMonth._sum.amount || 0,
        totalCollectedYear: totalCollectedYear._sum.amount || 0,
        clientsWithDebt: clientsWithDebt.length,
        monthlyInvoices,
        topClients,
        recentActivity: recentActivity.map((a) => ({
          id: a.id,
          previousStatus: a.previousStatus,
          newStatus: a.newStatus,
          comment: a.comment,
          createdAt: a.createdAt,
          changedBy: a.changedBy,
          invoice: a.invoice,
        })),
      },
    })
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 })
      }
      if (error.message === "Forbidden") {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 })
      }
    }
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
