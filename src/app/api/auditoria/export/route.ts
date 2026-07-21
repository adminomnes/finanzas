import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/auth"
import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import "jspdf-autotable"

export async function GET(request: Request) {
  try {
    const user = await requirePermission("audit.export")
    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") || "csv"
    const action = searchParams.get("action")
    const module = searchParams.get("module")
    const userId = searchParams.get("userId")
    const entity = searchParams.get("entity")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const where: Record<string, unknown> = {}
    if (action) where.action = action
    if (module) where.module = module
    if (userId) where.userId = userId
    if (entity) where.entity = entity
    if (startDate || endDate) {
      where.createdAt = {} as Record<string, Date>
      if (startDate) (where.createdAt as Record<string, Date>).gte = new Date(startDate)
      if (endDate) (where.createdAt as Record<string, Date>).lte = new Date(endDate + "T23:59:59.999Z")
    }

    const logs = await prisma.auditLog.findMany({
      where: where as never,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    const rows = logs.map((log, i) => ({
      "#": i + 1,
      "ID Auditoría": `AUD-${String(i + 1).padStart(6, "0")}`,
      Usuario: `${log.user.firstName} ${log.user.lastName}`,
      Email: log.user.email,
      Rol: log.role || log.user.role,
      Módulo: log.module || "",
      Acción: log.action,
      Entidad: log.entity,
      "ID Registro": log.entityId || "",
      Descripción: log.description,
      IP: log.ipAddress || "",
      Navegador: log.browser || "",
      "Sistema Operativo": log.os || "",
      Dispositivo: log.device || "",
      Fecha: new Date(log.createdAt).toLocaleDateString("es-CL"),
      Hora: new Date(log.createdAt).toLocaleTimeString("es-CL"),
    }))

    const title = "OMNES HOLDING SPA - Reporte de Auditoría Empresarial"

    if (format === "xlsx") {
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(rows as Record<string, unknown>[])
      XLSX.utils.sheet_add_aoa(ws, [[title]], { origin: "A1" })
      XLSX.utils.book_append_sheet(wb, ws, "Auditoría")
      const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
      return new NextResponse(buf, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="auditoria-${Date.now()}.xlsx"`,
        },
      })
    }

    if (format === "pdf") {
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })
      doc.setFontSize(14)
      doc.text(title, 14, 20)
      doc.setFontSize(9)
      doc.text(`Generado: ${new Date().toLocaleString("es-CL")}`, 14, 27)
      doc.text(`Total registros: ${rows.length}`, 14, 33)

      const pdfRows = rows.map((r) => [
        r["ID Auditoría"], r.Usuario, r.Rol, r.Módulo, r.Acción,
        r.Descripción.substring(0, 60), r.Fecha, r.Hora,
      ])

      ;(doc as any).autoTable({
        startY: 38,
        head: [["ID", "Usuario", "Rol", "Módulo", "Acción", "Descripción", "Fecha", "Hora"]],
        body: pdfRows,
        styles: { fontSize: 7 },
        headStyles: { fillColor: [37, 99, 235] },
      })

      const buf = Buffer.from(doc.output("arraybuffer"))
      return new NextResponse(buf, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="auditoria-${Date.now()}.pdf"`,
        },
      })
    }

    const csvHeaders = Object.keys(rows[0] || {}).join(",")
    const csvRows = rows.map((r) =>
      Object.values(r)
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    )
    const csv = `${csvHeaders}\n${csvRows.join("\n")}`

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="auditoria-${Date.now()}"`,
      },
    })
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") return NextResponse.json({ error: "No autenticado" }, { status: 401 })
      if (error.message === "Forbidden") return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
