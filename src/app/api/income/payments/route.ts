import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession, requireRole } from "@/lib/auth"
import { createAuditLog } from "@/lib/audit"

export async function GET(request: Request) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const invoiceId = searchParams.get("invoiceId")
    const clientId = searchParams.get("clientId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const method = searchParams.get("method")

    const where: Record<string, unknown> = {}
    if (invoiceId) where.invoiceId = invoiceId
    if (method) where.method = method
    if (clientId) {
      where.invoice = { clientId }
    }
    if (startDate || endDate) {
      where.date = {} as Record<string, Date>
      if (startDate) (where.date as Record<string, Date>).gte = new Date(startDate)
      if (endDate) (where.date as Record<string, Date>).lte = new Date(endDate)
    }

    const [data, total] = await Promise.all([
      prisma.payment.findMany({
        where: where as never,
        include: {
          invoice: {
            select: {
              id: true,
              number: true,
              totalAmount: true,
              clientId: true,
              client: { select: { name: true, rut: true } },
            },
          },
          createdBy: { select: { firstName: true, lastName: true } },
        },
        orderBy: { date: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.payment.count({ where: where as never }),
    ])

    return NextResponse.json({
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
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

export async function POST(request: Request) {
  try {
    const user = await requireRole("SUPER_ADMIN", "ADMIN", "OPERATOR")
    const body = await request.json()

    if (!body.amount || parseFloat(body.amount) <= 0) {
      return NextResponse.json(
        { error: "El monto debe ser mayor a cero" },
        { status: 400 }
      )
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: body.invoiceId },
      include: { payments: { select: { amount: true } } },
    })
    if (!invoice) {
      return NextResponse.json(
        { error: "Factura no encontrada" },
        { status: 404 }
      )
    }
    if (invoice.status === "PAGADA") {
      return NextResponse.json(
        { error: "La factura ya está pagada" },
        { status: 400 }
      )
    }

    const payment = await prisma.payment.create({
      data: {
        date: new Date(body.date),
        amount: parseFloat(body.amount),
        method: body.method || "TRANSFERENCIA",
        bank: body.bank,
        account: body.account,
        reference: body.reference,
        notes: body.notes,
        invoiceId: body.invoiceId,
        createdById: user.id,
      },
      include: {
        invoice: {
          select: {
            id: true,
            number: true,
            totalAmount: true,
            clientId: true,
            client: { select: { name: true, rut: true } },
          },
        },
        createdBy: { select: { firstName: true, lastName: true } },
      },
    })

    const totalPaid = invoice.payments.reduce(
      (sum, p) => sum + p.amount,
      parseFloat(body.amount)
    )

    if (totalPaid >= invoice.totalAmount) {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: "PAGADA" },
      })

      await prisma.invoiceStatusHistory.create({
        data: {
          previousStatus: invoice.status,
          newStatus: "PAGADA",
          invoiceId: invoice.id,
          changedById: user.id,
          comment: "Pago registrado - factura pagada en su totalidad",
        },
      })
    }

    await createAuditLog({
      userId: user.id,
      action: "CREATE",
      entity: "Payment",
      entityId: payment.id,
      module: "COBRANZA",
      description: `Pago registrado: $${body.amount} - Factura ${invoice.number}`,
      newValue: body,
    })

    return NextResponse.json({ data: payment }, { status: 201 })
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
