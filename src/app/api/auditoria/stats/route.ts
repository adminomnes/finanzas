import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/auth"

export async function GET() {
  try {
    await requirePermission("audit.view")
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const sevenDaysAgo = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [
      totalActionsToday,
      totalActions,
      failedLoginsToday,
      loginAttempts,
      recentLogs,
      actionCounts,
      moduleCounts,
      userActivity,
      dailyActivity,
    ] = await Promise.all([
      prisma.auditLog.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.auditLog.count(),
      prisma.auditLog.count({
        where: { action: "LOGIN_FAILED", createdAt: { gte: todayStart } },
      }),
      prisma.loginAttempt.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.auditLog.findMany({
        include: { user: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.auditLog.groupBy({
        by: ["action"],
        _count: true,
        orderBy: { _count: { action: "desc" } },
        take: 10,
      }),
      prisma.auditLog.groupBy({
        by: ["module"],
        _count: true,
        orderBy: { _count: { module: "desc" } },
      }),
      prisma.auditLog.groupBy({
        by: ["userId"],
        _count: true,
        orderBy: { _count: { userId: "desc" } },
        take: 10,
      }),
      (async () => {
        const days: { date: string; count: number }[] = []
        for (let i = 6; i >= 0; i--) {
          const d = new Date(todayStart.getTime() - i * 24 * 60 * 60 * 1000)
          const next = new Date(d.getTime() + 24 * 60 * 60 * 1000)
          const count = await prisma.auditLog.count({
            where: { createdAt: { gte: d, lt: next } },
          })
          days.push({
            date: d.toLocaleDateString("es-CL", { day: "2-digit", month: "short" }),
            count,
          })
        }
        return days
      })(),
    ])

    const usersWithDetails = await Promise.all(
      userActivity.map(async (u) => {
        const usr = await prisma.user.findUnique({
          where: { id: u.userId },
          select: { firstName: true, lastName: true },
        })
        return {
          userId: u.userId,
          name: usr ? `${usr.firstName} ${usr.lastName}` : "Desconocido",
          count: u._count,
        }
      })
    )

    return NextResponse.json({
      totalActionsToday,
      totalActions,
      failedLoginsToday,
      totalLoginAttempts: loginAttempts,
      recentActivity: recentLogs.map((l) => ({
        id: l.id,
        action: l.action,
        entity: l.entity,
        module: l.module,
        description: l.description,
        createdAt: l.createdAt,
        user: l.user,
      })),
      actionCounts: actionCounts.map((a) => ({ action: a.action, count: a._count })),
      moduleCounts: moduleCounts.map((m) => ({ module: m.module, count: m._count })),
      userActivity: usersWithDetails,
      dailyActivity,
    })
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") return NextResponse.json({ error: "No autenticado" }, { status: 401 })
      if (error.message === "Forbidden") return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
