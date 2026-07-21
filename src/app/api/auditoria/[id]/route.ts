import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/auth"
import { getChangedFields, formatAuditId } from "@/lib/audit"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission("audit.view")
    const { id } = await params

    const log = await prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
      },
    })

    if (!log) {
      return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 })
    }

    const changes = (log.oldValue && log.newValue)
      ? getChangedFields(
          log.oldValue as Record<string, unknown>,
          log.newValue as Record<string, unknown>
        )
      : []

    const count = await prisma.auditLog.count({ where: { createdAt: { lte: log.createdAt } } })

    const isSuperAdmin = user.role === "SUPER_ADMIN"

    return NextResponse.json({
      data: {
        ...log,
        auditId: formatAuditId(count),
        changes,
        ...(isSuperAdmin ? {} : { ipAddress: undefined, userAgent: undefined }),
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
