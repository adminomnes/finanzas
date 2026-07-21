import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/auth"
import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import "jspdf-autotable"

export async function GET(request: Request) {
  try {
    const user = await requirePermission("expenses.export")
    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") || "csv"

    const where: Record<string, unknown> = {}
    const status = searchParams.get("status")
    const companyId = searchParams.get("companyId")
    const categoryId = searchParams.get("categoryId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    if (status) where.status = status
    if (companyId) where.companyId = companyId
    if (categoryId) where.categoryId = categoryId
    if (startDate || endDate) {
      where.date = {} as Record<string, Date>
      if (startDate) (where.date as Record<string, Date>).gte = new Date(startDate)
      if (endDate) (where.date as Record<string, Date>).lte = new Date(endDate + "T23:59:59.999Z")
    }

    const expenses = await prisma.expense.findMany({
      where: where as never,
      include: {
        company: { select: { name: true } },
        supplier: { select: { name: true, rut: true } },
        category: { select: { name: true } },
        costCenter: { select: { name: true, code: true } },
        responsible: { select: { firstName: true, lastName: true } },
        createdBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    const rows = expenses.map((e, i) => ({
      "#": i + 1,
      Código: e.code,
      Fecha: new Date(e.date).toLocaleDateString("es-CL"),
      Proveedor: e.supplier.name,
      "RUT Prov.": e.supplier.rut,
      Categoría: e.category.name,
      Empresa: e.company.name,
      "C. Costo": e.costCenter.code,
      Descripción: e.description,
      Neto: e.netAmount,
      IVA: e.taxAmount,
      Total: e.totalAmount,
      Moneda: e.currency,
      "Método Pago": e.paymentMethod,
      Estado: e.status,
      Responsable: `${e.responsible.firstName} ${e.responsible.lastName}`,
      "Creado por": `${e.createdBy.firstName} ${e.createdBy.lastName}`,
    }))

    const title = "OMNES HOLDING SPA - Reporte de Gastos"

    if (format === "xlsx") {
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(rows as Record<string, unknown>[])
      XLSX.utils.sheet_add_aoa(ws, [[title]], { origin: "A1" })
      XLSX.utils.book_append_sheet(wb, ws, "Gastos")
      const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
      return new NextResponse(buf, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="gastos-${Date.now()}.xlsx"`,
        },
      })
    }

    if (format === "pdf") {
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })
      doc.setFontSize(14)
      doc.text(title, 14, 20)
      doc.setFontSize(8)
      doc.text(`Generado por: ${user.firstName} ${user.lastName}`, 14, 27)
      doc.text(`Fecha: ${new Date().toLocaleDateString("es-CL")}`, 14, 32)

      const pdfRows = rows.map((r) => [r.Código, r.Fecha, r.Proveedor, r.Categoría, r.Total, r.Estado])
      ;(doc as any).autoTable({
        startY: 38,
        head: [["Código", "Fecha", "Proveedor", "Categoría", "Total", "Estado"]],
        body: pdfRows,
        styles: { fontSize: 7 },
        headStyles: { fillColor: [37, 99, 235] },
      })

      const buf = Buffer.from(doc.output("arraybuffer"))
      return new NextResponse(buf, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="gastos-${Date.now()}.pdf"`,
        },
      })
    }

    const csvHeaders = Object.keys(rows[0] || {}).join(",")
    const csvRows = rows.map((r) => Object.values(r).map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
    const csv = `${csvHeaders}\n${csvRows.join("\n")}`
    return new NextResponse(csv, {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="gastos-${Date.now()}.csv"` },
    })
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") return NextResponse.json({ error: "No autenticado" }, { status: 401 })
      if (error.message === "Forbidden") return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
