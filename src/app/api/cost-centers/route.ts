import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession, requireRole } from "@/lib/auth"
import { createAuditLog } from "@/lib/audit"

export async function GET() {
  try {
    await getSession()
    const costCenters = await prisma.costCenter.findMany({
      where: { isActive: true },
      orderBy: { code: "asc" },
    })
    return NextResponse.json({ data: costCenters })
  } catch {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole("SUPER_ADMIN", "ADMIN")
    const body = await request.json()

    const costCenter = await prisma.costCenter.create({
      data: {
        name: body.name,
        code: body.code,
        budget: body.budget ? parseFloat(body.budget) : null,
      },
    })

    await createAuditLog({
      userId: user.id,
      action: "CREATE",
      entity: "CostCenter",
      entityId: costCenter.id,
      description: `Centro de costo creado: ${body.name} (${body.code})`,
      newValue: body,
    })

    return NextResponse.json({ data: costCenter }, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
