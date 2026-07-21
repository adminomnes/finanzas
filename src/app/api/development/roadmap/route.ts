import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth"
import { createAuditLog } from "@/lib/audit"

export async function GET() {
  try {
    await requireRole("SUPER_ADMIN")
    const roadmap = await prisma.developmentRoadmap.findMany({
      include: {
        version: true,
        assignee: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { orderIndex: "asc" },
    })
    return NextResponse.json({ data: roadmap })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole("SUPER_ADMIN")
    const body = await request.json()
    const { name, description, priority, status, estimatedDate, notes, versionId, assigneeId } = body

    // Get highest order
    const lastItem = await prisma.developmentRoadmap.findFirst({
      orderBy: { orderIndex: "desc" },
    })
    const orderIndex = lastItem ? lastItem.orderIndex + 1 : 0

    const item = await prisma.developmentRoadmap.create({
      data: {
        name,
        description,
        priority: priority || "MEDIA",
        status: status || "PENDIENTE",
        estimatedDate: estimatedDate ? new Date(estimatedDate) : null,
        notes,
        orderIndex,
        versionId: versionId || null,
        assigneeId: assigneeId || null,
      },
    })

    await createAuditLog({
      userId: user.id,
      action: "CREATE",
      module: "DESARROLLO",
      entity: "DevelopmentRoadmap",
      entityId: item.id,
      description: `Creación de tarea en roadmap: ${name}`,
    })

    return NextResponse.json({ data: item }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
