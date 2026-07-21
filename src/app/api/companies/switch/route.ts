import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { createAuditLog } from "@/lib/audit"

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    if (!body.companyId) {
      return NextResponse.json(
        { error: "companyId es requerido" },
        { status: 400 }
      )
    }

    const company = await prisma.company.findUnique({
      where: { id: body.companyId },
    })

    if (!company) {
      return NextResponse.json(
        { error: "Empresa no encontrada" },
        { status: 404 }
      )
    }

    if (user.role !== "SUPER_ADMIN") {
      const hasAccess = await prisma.companyUser.findUnique({
        where: {
          userId_companyId: {
            userId: user.id,
            companyId: body.companyId,
          },
          isActive: true,
        },
      })

      if (!hasAccess) {
        return NextResponse.json(
          { error: "No tienes acceso a esta empresa" },
          { status: 403 }
        )
      }
    }

    await createAuditLog({
      userId: user.id,
      action: "UPDATE",
      module: "MULTIEMPRESA",
      entity: "CompanyContext",
      entityId: body.companyId,
      description: `Cambio de contexto a empresa: ${company.name}`,
      newValue: { companyId: body.companyId, companyName: company.name },
    })

    return NextResponse.json({ success: true, company })
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 })
      }
    }
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
