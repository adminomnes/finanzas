import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession, requireRole } from "@/lib/auth"
import { createAuditLog } from "@/lib/audit"

async function generateCode(): Promise<string> {
  const last = await prisma.expense.findFirst({ orderBy: { createdAt: "desc" }, select: { code: true } })
  const num = last ? parseInt(last.code.replace("GAS-", "")) + 1 : 1
  return `GAS-${String(num).padStart(6, "0")}`
}

export async function GET(request: Request) {
  try {
    const user = await getSession()
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const status = searchParams.get("status")
    const companyId = searchParams.get("companyId")
    const categoryId = searchParams.get("categoryId")
    const supplierId = searchParams.get("supplierId")
    const costCenterId = searchParams.get("costCenterId")
    const responsibleId = searchParams.get("responsibleId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const minAmount = searchParams.get("minAmount")
    const maxAmount = searchParams.get("maxAmount")
    const search = searchParams.get("search")

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (companyId) where.companyId = companyId
    if (categoryId) where.categoryId = categoryId
    if (supplierId) where.supplierId = supplierId
    if (costCenterId) where.costCenterId = costCenterId
    if (responsibleId) where.responsibleId = responsibleId
    if (startDate || endDate) {
      where.date = {} as Record<string, Date>
      if (startDate) (where.date as Record<string, Date>).gte = new Date(startDate)
      if (endDate) (where.date as Record<string, Date>).lte = new Date(endDate + "T23:59:59.999Z")
    }
    if (minAmount || maxAmount) {
      where.totalAmount = {} as Record<string, number>
      if (minAmount) (where.totalAmount as Record<string, number>).gte = parseFloat(minAmount)
      if (maxAmount) (where.totalAmount as Record<string, number>).lte = parseFloat(maxAmount)
    }
    if (search) {
      where.OR = [
        { code: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { documentNumber: { contains: search, mode: "insensitive" } },
      ]
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where: where as never,
        include: {
          company: { select: { id: true, name: true } },
          supplier: { select: { id: true, name: true } },
          category: { select: { id: true, name: true, color: true } },
          costCenter: { select: { id: true, name: true, code: true } },
          responsible: { select: { id: true, firstName: true, lastName: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          statusHistory: { orderBy: { createdAt: "desc" }, take: 1 },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.expense.count({ where: where as never }),
    ])

    return NextResponse.json({ data: expenses, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole("SUPER_ADMIN", "ADMIN", "OPERATOR")
    const body = await request.json()

    if (!body.companyId || !body.supplierId || !body.categoryId || !body.costCenterId || !body.description || body.netAmount === undefined) {
      return NextResponse.json({ error: "Complete todos los campos requeridos" }, { status: 400 })
    }

    const netAmount = parseFloat(body.netAmount)
    const taxAmount = body.taxAmount ? parseFloat(body.taxAmount) : Math.round(netAmount * 0.19)
    const totalAmount = body.totalAmount ? parseFloat(body.totalAmount) : netAmount + taxAmount

    const code = await generateCode()

    const expense = await prisma.expense.create({
      data: {
        code,
        date: new Date(body.date),
        companyId: body.companyId,
        supplierId: body.supplierId,
        documentType: body.documentType || "BOLETA",
        documentNumber: body.documentNumber,
        documentDate: body.documentDate ? new Date(body.documentDate) : null,
        categoryId: body.categoryId,
        costCenterId: body.costCenterId,
        description: body.description,
        netAmount,
        taxAmount,
        totalAmount,
        currency: body.currency || "CLP",
        paymentMethod: body.paymentMethod || "TRANSFERENCIA",
        account: body.account,
        area: body.area,
        responsibleId: body.responsibleId || user.id,
        createdById: user.id,
        notes: body.notes,
      },
      include: {
        company: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
        category: { select: { id: true, name: true, color: true } },
        costCenter: { select: { id: true, name: true, code: true } },
        responsible: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    await prisma.expenseStatusHistory.create({
      data: { expenseId: expense.id, newStatus: "DRAFT", changedById: user.id, comment: "Gasto creado" },
    })

    await createAuditLog({
      userId: user.id,
      action: "CREATE",
      entity: "Expense",
      entityId: expense.id,
      description: `Gasto ${code} creado: $${totalAmount.toLocaleString()} - ${body.description}`,
      newValue: { code, ...body, netAmount, taxAmount, totalAmount },
    })

    return NextResponse.json({ data: expense }, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") return NextResponse.json({ error: "No autenticado" }, { status: 401 })
      if (error.message === "Forbidden") return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
