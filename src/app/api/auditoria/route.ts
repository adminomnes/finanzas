import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    const user = await requirePermission("audit.view")
    const { searchParams } = new URL(request.url)

    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const action = searchParams.get("action")
    const module = searchParams.get("module")
    const userId = searchParams.get("userId")
    const entity = searchParams.get("entity")
    const search = searchParams.get("search")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const role = searchParams.get("role")
    const sort = searchParams.get("sort") || "desc"

    const where: Record<string, unknown> = {}

    if (action) where.action = action
    if (module) where.module = module
    if (userId) where.userId = userId
    if (entity) where.entity = entity
    if (role) where.role = role

    if (startDate || endDate) {
      where.createdAt = {} as Record<string, Date>
      if (startDate) (where.createdAt as Record<string, Date>).gte = new Date(startDate)
      if (endDate) (where.createdAt as Record<string, Date>).lte = new Date(endDate + "T23:59:59.999Z")
    }

    if (search) {
      where.OR = [
        { description: { contains: search, mode: "insensitive" } },
        { entityId: { contains: search, mode: "insensitive" } },
      ]
    }

    const isSuperAdmin = user.role === "SUPER_ADMIN"

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: where as never,
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true, role: true },
          },
        },
        orderBy: { createdAt: sort as "asc" | "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where: where as never }),
    ])

    const data = logs.map((log, index) => ({
      ...log,
      auditId: `AUD-${String((page - 1) * limit + index + 1).padStart(6, "0")}`,
    }))

    return NextResponse.json({
      data: isSuperAdmin ? data : data.map(({ ipAddress, userAgent, ...rest }) => rest),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") return NextResponse.json({ error: "No autenticado" }, { status: 401 })
      if (error.message === "Forbidden") return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST() {
  return NextResponse.json({ error: "Los registros de auditoría son inmutables" }, { status: 405 })
}

export async function PATCH() {
  return NextResponse.json({ error: "Los registros de auditoría son inmutables" }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({ error: "Los registros de auditoría son inmutables" }, { status: 405 })
}
