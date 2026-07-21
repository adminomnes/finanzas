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
    const status = searchParams.get("status")
    const companyId = searchParams.get("companyId")
    const categoryId = searchParams.get("categoryId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (companyId) where.companyId = companyId
    if (categoryId) where.categoryId = categoryId
    if (startDate || endDate) {
      where.date = {} as Record<string, Date>
      if (startDate) (where.date as Record<string, Date>).gte = new Date(startDate)
      if (endDate) (where.date as Record<string, Date>).lte = new Date(endDate)
    }

    const [income, total] = await Promise.all([
      prisma.income.findMany({
        where: where as never,
        include: {
          company: { select: { id: true, name: true } },
          category: { select: { id: true, name: true, color: true } },
          createdBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
        orderBy: { date: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.income.count({ where }),
    ])

    return NextResponse.json({
      data: income,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch {
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

    const income = await prisma.income.create({
      data: {
        date: new Date(body.date),
        companyId: body.companyId,
        categoryId: body.categoryId,
        description: body.description,
        netAmount: parseFloat(body.netAmount),
        taxAmount: body.taxAmount ? parseFloat(body.taxAmount) : 0,
        totalAmount: parseFloat(body.totalAmount),
        paymentMethod: body.paymentMethod || "TRANSFERENCIA",
        createdById: user.id,
        notes: body.notes,
      },
      include: {
        company: { select: { id: true, name: true } },
        category: { select: { id: true, name: true, color: true } },
      },
    })

    await createAuditLog({
      userId: user.id,
      action: "CREATE",
      entity: "Income",
      entityId: income.id,
      description: `Ingreso creado: $${body.totalAmount} - ${body.description}`,
      newValue: body,
    })

    return NextResponse.json({ data: income }, { status: 201 })
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
