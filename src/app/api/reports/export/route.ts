import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth"
import { createAuditLog } from "@/lib/audit"
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns"
import { es } from "date-fns/locale"
import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import "jspdf-autotable"

export async function GET(request: Request) {
  try {
    const user = await requireRole("SUPER_ADMIN", "ADMIN")
    const { searchParams } = new URL(request.url)
    const fmt = searchParams.get("format") || "xlsx"
    const type = searchParams.get("type") || "financial"
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const companyId = searchParams.get("companyId")

    const now = new Date()
    const dateFilter: Record<string, unknown> = {}
    if (startDate || endDate) {
      dateFilter.gte = startDate ? new Date(startDate) : new Date(0)
      dateFilter.lte = endDate ? new Date(endDate + "T23:59:59.999Z") : new Date()
    }

    const companyFilter: Record<string, unknown> = {}
    if (companyId) companyFilter.companyId = companyId

    const headerInfo = {
      title: "OMNES HOLDING SPA - OMNES FINANCE",
      generatedBy: `${user.firstName} ${user.lastName}`,
      generatedAt: new Date().toLocaleDateString("es-CL", {
        year: "numeric", month: "long", day: "numeric",
        hour: "2-digit", minute: "2-digit",
      }),
    }

    await createAuditLog({
      userId: user.id,
      action: "EXPORT",
      entity: "Report",
      module: "CONFIGURACION",
      description: `Exportación de reporte ${type} en formato ${fmt.toUpperCase()}`,
    })

    if (type === "financial") {
      const monthStart = startOfMonth(now)
      const monthEnd = endOfMonth(now)
      const prevMonthStart = startOfMonth(subMonths(now, 1))
      const prevMonthEnd = endOfMonth(subMonths(now, 1))

      const calcIncome = (gte: Date, lte: Date) =>
        Promise.all([
          prisma.invoice.aggregate({
            _sum: { totalAmount: true },
            where: { issueDate: { gte, lte }, status: { not: "ANULADA" } },
          }),
          prisma.income.aggregate({
            _sum: { totalAmount: true },
            where: { date: { gte, lte } },
          }),
        ]).then(([i, inc]) => (i._sum.totalAmount || 0) + (inc._sum.totalAmount || 0))

      const calcExp = (gte: Date, lte: Date) =>
        prisma.expense.aggregate({
          _sum: { totalAmount: true },
          where: { date: { gte, lte }, status: { in: ["APPROVED", "PAGADO"] } },
        }).then((r) => r._sum.totalAmount || 0)

      const [totalIncome, totalExpenses, prevIncome, prevExp] = await Promise.all([
        calcIncome(monthStart, monthEnd), calcExp(monthStart, monthEnd),
        calcIncome(prevMonthStart, prevMonthEnd), calcExp(prevMonthStart, prevMonthEnd),
      ])

      const netResult = totalIncome - totalExpenses
      const prevResult = prevIncome - prevExp

      const cv = (c: number, p: number) => (p !== 0 ? ((c - p) / Math.abs(p)) * 100 : 0)

      const rows = [
        { Métrica: "Ingresos del mes", Valor: totalIncome.toLocaleString("es-CL"), "Mes anterior": prevIncome.toLocaleString("es-CL"), Variación: `${cv(totalIncome, prevIncome).toFixed(1)}%` },
        { Métrica: "Gastos del mes", Valor: totalExpenses.toLocaleString("es-CL"), "Mes anterior": prevExp.toLocaleString("es-CL"), Variación: `${cv(totalExpenses, prevExp).toFixed(1)}%` },
        { Métrica: "Resultado neto", Valor: netResult.toLocaleString("es-CL"), "Mes anterior": prevResult.toLocaleString("es-CL"), Variación: `${cv(netResult, prevResult).toFixed(1)}%` },
      ]

      return exportResponse(fmt, rows, "Resumen Ejecutivo", headerInfo)
    }

    if (type === "expenses") {
      const where: Record<string, unknown> = { ...companyFilter }
      if (startDate || endDate) where.date = dateFilter

      const expenses = await prisma.expense.findMany({
        where: where as never,
        include: {
          company: { select: { name: true } },
          supplier: { select: { name: true, rut: true } },
          category: { select: { name: true } },
          responsible: { select: { firstName: true, lastName: true } },
        },
        orderBy: { date: "desc" },
      })

      const rows = expenses.map((e, i) => ({
        "#": i + 1,
        Código: e.code,
        Fecha: new Date(e.date).toLocaleDateString("es-CL"),
        Proveedor: e.supplier.name,
        "RUT Prov.": e.supplier.rut,
        Categoría: e.category.name,
        Empresa: e.company.name,
        Descripción: e.description,
        Neto: e.netAmount,
        IVA: e.taxAmount,
        Total: e.totalAmount,
        Estado: e.status,
        Responsable: `${e.responsible.firstName} ${e.responsible.lastName}`,
      }))

      return exportResponse(fmt, rows, "Reporte de Gastos", headerInfo)
    }

    if (type === "cashflow") {
      const monthlyCashFlow: { month: string; income: number; expenses: number; balance: number }[] = []
      for (let i = 11; i >= 0; i--) {
        const d = subMonths(now, i)
        const start = startOfMonth(d)
        const end = endOfMonth(d)
        const cf: Record<string, unknown> = companyId ? { companyId } : {}

        const [invAgg, incAgg, expAgg] = await Promise.all([
          prisma.invoice.aggregate({
            _sum: { totalAmount: true },
            where: { issueDate: { gte: start, lte: end }, status: "PAGADA", ...cf } as never,
          }),
          prisma.income.aggregate({
            _sum: { totalAmount: true },
            where: { date: { gte: start, lte: end }, status: "RECEIVED", ...cf } as never,
          }),
          prisma.expense.aggregate({
            _sum: { totalAmount: true },
            where: { date: { gte: start, lte: end }, status: { in: ["APPROVED", "PAGADO"] }, ...cf } as never,
          }),
        ])

        const inc = (invAgg._sum.totalAmount || 0) + (incAgg._sum.totalAmount || 0)
        const exp = expAgg._sum.totalAmount || 0
        monthlyCashFlow.push({
          month: format(d, "MMM yyyy", { locale: es }),
          income: inc,
          expenses: exp,
          balance: inc - exp,
        })
      }

      const rows = monthlyCashFlow.map((m) => ({
        Mes: m.month,
        Ingresos: m.income.toLocaleString("es-CL"),
        Gastos: m.expenses.toLocaleString("es-CL"),
        Balance: m.balance.toLocaleString("es-CL"),
      }))

      return exportResponse(fmt, rows, "Flujo de Caja", headerInfo)
    }

    return NextResponse.json({ error: "Tipo de reporte no válido" }, { status: 400 })
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") return NextResponse.json({ error: "No autenticado" }, { status: 401 })
      if (error.message === "Forbidden") return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

function exportResponse(
  format: string,
  rows: Record<string, unknown>[],
  sheetName: string,
  headerInfo: { title: string; generatedBy: string; generatedAt: string },
) {
  const filename = `${sheetName.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`

  if (format === "xlsx") {
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(rows)
    XLSX.utils.sheet_add_aoa(ws, [[headerInfo.title]], { origin: "A1" })
    XLSX.utils.sheet_add_aoa(ws, [[`Generado por: ${headerInfo.generatedBy} - ${headerInfo.generatedAt}`]], { origin: "A2" })
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
      },
    })
  }

  if (format === "pdf") {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })
    doc.setFontSize(12)
    doc.text(headerInfo.title, 14, 16)
    doc.setFontSize(8)
    doc.text(`Generado por: ${headerInfo.generatedBy} - ${headerInfo.generatedAt}`, 14, 23)

    const cols = rows.length > 0 ? Object.keys(rows[0]) : []
    const pdfRows = rows.map((r) => cols.map((c) => String(r[c] ?? "")))
    ;(doc as any).autoTable({
      startY: 30,
      head: [cols],
      body: pdfRows,
      styles: { fontSize: 7 },
      headStyles: { fillColor: [37, 99, 235] },
    })

    const buf = Buffer.from(doc.output("arraybuffer"))
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}.pdf"`,
      },
    })
  }

  const csvHeaders = rows.length > 0 ? Object.keys(rows[0]).join(",") : ""
  const csvRows = rows.map((r) =>
    Object.values(r)
      .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
      .join(","),
  )
  const csv = `${csvHeaders}\n${csvRows.join("\n")}`
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}.csv"`,
    },
  })
}
