import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth"
import { createAuditLog } from "@/lib/audit"
import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import "jspdf-autotable"

export async function GET(request: Request) {
  try {
    const user = await requireRole("SUPER_ADMIN", "ADMIN")
    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") || "csv"

    const where: Record<string, unknown> = {}
    const status = searchParams.get("status")
    const clientId = searchParams.get("clientId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    if (status) where.status = status
    if (clientId) where.clientId = clientId
    if (startDate || endDate) {
      where.issueDate = {} as Record<string, Date>
      if (startDate) (where.issueDate as Record<string, Date>).gte = new Date(startDate)
      if (endDate) (where.issueDate as Record<string, Date>).lte = new Date(endDate + "T23:59:59.999Z")
    }

    const invoices = await prisma.invoice.findMany({
      where: where as never,
      include: {
        client: { select: { name: true, rut: true } },
        company: { select: { name: true } },
      },
      orderBy: { issueDate: "desc" },
    })

    const rows = invoices.map((inv) => ({
      "N° Factura": inv.number,
      Fecha: new Date(inv.issueDate).toLocaleDateString("es-CL"),
      Cliente: inv.client.name,
      RUT: inv.client.rut,
      Neto: inv.netAmount,
      IVA: inv.taxAmount,
      Total: inv.totalAmount,
      Estado: inv.status,
    }))

    const dateStr = new Date().toISOString().split("T")[0]
    const filename = `facturas_${dateStr}`

    await createAuditLog({
      userId: user.id,
      action: "EXPORT",
      entity: "Invoice",
      module: "FACTURACION",
      description: `Exportación de facturas en formato ${format.toUpperCase()}`,
    })

    if (format === "xlsx") {
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(rows as Record<string, unknown>[])
      XLSX.utils.book_append_sheet(wb, ws, "Facturas")
      const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
        },
      })
    }

    if (format === "pdf") {
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })
      doc.setFontSize(14)
      doc.text("Facturas", 14, 20)
      doc.setFontSize(8)
      doc.text(`Generado por: ${user.firstName} ${user.lastName}`, 14, 27)
      doc.text(`Fecha: ${new Date().toLocaleDateString("es-CL")}`, 14, 32)
      ;(doc as any).autoTable({
        startY: 38,
        head: [["N° Factura", "Fecha", "Cliente", "RUT", "Neto", "IVA", "Total", "Estado"]],
        body: rows.map((r) => [r["N° Factura"], r.Fecha, r.Cliente, r.RUT, r.Neto, r.IVA, r.Total, r.Estado]),
        styles: { fontSize: 7 },
        headStyles: { fillColor: [37, 99, 235] },
      })
      const pdfBuffer = Buffer.from(doc.output("arraybuffer"))
      return new NextResponse(pdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}.pdf"`,
        },
      })
    }

    const csvHeaders = Object.keys(rows[0] || {}).join(",")
    const csvRows = rows.map((r) =>
      Object.values(r)
        .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
        .join(",")
    )
    const csv = `${csvHeaders}\n${csvRows.join("\n")}`
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}.csv"`,
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
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
