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
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "20")))
    const search = searchParams.get("search")
    const isActive = searchParams.get("isActive")

    const where: Record<string, unknown> = {}
    if (isActive === "true") where.isActive = true
    else if (isActive === "false") where.isActive = false

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { rut: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ]
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where: where as never,
        orderBy: { name: "asc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { invoices: true } },
        },
      }),
      prisma.client.count({ where }),
    ])

    const data = await Promise.all(
      clients.map(async (client) => {
        const result = await prisma.invoice.aggregate({
          where: { clientId: client.id, status: { not: "ANULADA" } },
          _sum: { totalAmount: true },
        })
        return {
          ...client,
          totalInvoiced: result._sum.totalAmount || 0,
        }
      })
    )

    return NextResponse.json({
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole("SUPER_ADMIN", "ADMIN", "OPERATOR")
    const body = await request.json()

    if (!body.name || !body.rut) {
      return NextResponse.json({ error: "Nombre y RUT son requeridos" }, { status: 400 })
    }

    const existing = await prisma.client.findUnique({ where: { rut: body.rut } })
    if (existing) {
      return NextResponse.json({ error: "El RUT ya está registrado" }, { status: 409 })
    }

    const client = await prisma.client.create({
      data: {
        name: body.name,
        rut: body.rut,
        type: body.type || "EMPRESA",
        address: body.address,
        phone: body.phone,
        email: body.email,
        contactName: body.contactName,
        paymentTerms: body.paymentTerms || "30",
      },
    })

    await createAuditLog({
      userId: user.id,
      action: "CREATE",
      module: "CLIENTES",
      entity: "Client",
      entityId: client.id,
      description: `Cliente creado: ${body.name}`,
      newValue: body,
    })

    return NextResponse.json({ data: client }, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") return NextResponse.json({ error: "No autenticado" }, { status: 401 })
      if (error.message === "Forbidden") return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
