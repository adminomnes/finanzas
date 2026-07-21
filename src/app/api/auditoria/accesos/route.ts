import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    await requirePermission("audit.view")
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "30")
    const success = searchParams.get("success")
    const email = searchParams.get("email")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const where: Record<string, unknown> = {}
    if (success !== null) where.success = success === "true"
    if (email) where.email = { contains: email, mode: "insensitive" }
    if (startDate || endDate) {
      where.createdAt = {} as Record<string, Date>
      if (startDate) (where.createdAt as Record<string, Date>).gte = new Date(startDate)
      if (endDate) (where.createdAt as Record<string, Date>).lte = new Date(endDate + "T23:59:59.999Z")
    }

    const [attempts, total] = await Promise.all([
      prisma.loginAttempt.findMany({
        where: where as never,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.loginAttempt.count({ where: where as never }),
    ])

    const [totalSuccess, totalFailed, totalBlocked] = await Promise.all([
      prisma.loginAttempt.count({ where: { success: true } }),
      prisma.loginAttempt.count({ where: { success: false } }),
      prisma.user.count({ where: { isLocked: true } }),
    ])

    return NextResponse.json({
      data: attempts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      summary: { totalSuccess, totalFailed, totalBlocked },
    })
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") return NextResponse.json({ error: "No autenticado" }, { status: 401 })
      if (error.message === "Forbidden") return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
