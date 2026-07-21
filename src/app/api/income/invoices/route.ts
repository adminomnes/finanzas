import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession, requireRole } from "@/lib/auth"
import { createAuditLog } from "@/lib/audit"
import type { InvoiceStatus } from "@prisma/client"

export async function GET(request: Request) {
  try {
    const user = await getSession()
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "20")))
    const status = searchParams.get("status")
    const clientId = searchParams.get("clientId")
    const companyId = searchParams.get("companyId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const search = searchParams.get("search")

    const where: Record<string, unknown> = {}
    if (status) where.status = { in: status.split(",") as InvoiceStatus[] }
    if (clientId) where.clientId = clientId
    if (companyId) where.companyId = companyId
    if (search) {
      where.OR = [
        { number: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }
    if (startDate || endDate) {
      where.issueDate = {} as Record<string, Date>
      if (startDate) (where.issueDate as Record<string, Date>).gte = new Date(startDate)
      if (endDate) (where.issueDate as Record<string, Date>).lte = new Date(endDate + "T23:59:59.999Z")
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where: where as never,
        include: {
          client: { select: { id: true, name: true, rut: true } },
          company: { select: { id: true, name: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          items: true,
          payments: { select: { id: true, amount: true, date: true } },
        },
        orderBy: { issueDate: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.invoice.count({ where: where as never }),
    ])

    return NextResponse.json({ data: invoices, total, page, totalPages: Math.ceil(total / limit) })
  } catch {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole("SUPER_ADMIN", "ADMIN", "OPERATOR")
    const body = await request.json()

    const today = new Date()
    const dateStr = today.toISOString().split("T")[0].replace(/-/g, "")
    const lastInvoice = await prisma.invoice.findFirst({
      where: { number: { startsWith: `FAC-${dateStr}` } },
      orderBy: { number: "desc" },
      select: { number: true },
    })
    const seq = lastInvoice ? String(parseInt(lastInvoice.number.slice(-4)) + 1).padStart(4, "0") : "0001"
    const number = `FAC-${dateStr}-${seq}`

    const items = (body.items || []).map((item: { description: string; quantity: number; unitValue: number; discount?: number; total?: number }) => ({
      description: item.description,
      quantity: item.quantity || 1,
      unitValue: item.unitValue || 0,
      discount: item.discount || 0,
      total: (item.quantity || 1) * (item.unitValue || 0) * (1 - (item.discount || 0) / 100),
    }))

    const netAmount = items.reduce((sum: number, item: { total: number }) => sum + item.total, 0)
    const taxAmount = netAmount * 0.19
    const totalAmount = netAmount + taxAmount

    const invoice = await prisma.invoice.create({
      data: {
        number,
        issueDate: new Date(body.issueDate || today),
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        description: body.description || null,
        netAmount,
        taxAmount,
        totalAmount,
        currency: body.currency || "CLP",
        notes: body.notes || null,
        pdfUrl: body.pdfUrl || null,
        xmlUrl: body.xmlUrl || null,
        clientId: body.clientId,
        companyId: body.companyId,
        createdById: user.id,
        items: { create: items },
        statusHistory: {
          create: {
            previousStatus: null,
            newStatus: "BORRADOR",
            changedById: user.id,
          },
        },
      },
      include: {
        client: { select: { id: true, name: true, rut: true } },
        company: { select: { id: true, name: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        items: true,
      },
    })

    await createAuditLog({
      userId: user.id,
      action: "CREATE",
      entity: "Invoice",
      entityId: invoice.id,
      module: "FACTURACION",
      description: `Factura creada: ${number} - ${body.clientId}`,
      newValue: body,
    })

    return NextResponse.json({ data: invoice }, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") return NextResponse.json({ error: "No autenticado" }, { status: 401 })
      if (error.message === "Forbidden") return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
