import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth"
import { createAuditLog } from "@/lib/audit"

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole("SUPER_ADMIN")
    const { id } = await props.params
    const body = await request.json()

    const item = await prisma.developmentRoadmap.update({
      where: { id },
      data: body,
    })

    await createAuditLog({
      userId: user.id,
      action: "UPDATE",
      module: "DESARROLLO",
      entity: "DevelopmentRoadmap",
      entityId: id,
      description: `Actualización de tarea en roadmap: ${item.name}`,
    })

    return NextResponse.json({ data: item })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole("SUPER_ADMIN")
    const { id } = await props.params

    const item = await prisma.developmentRoadmap.delete({
      where: { id },
    })

    await createAuditLog({
      userId: user.id,
      action: "DELETE",
      module: "DESARROLLO",
      entity: "DevelopmentRoadmap",
      entityId: id,
      description: `Eliminación de tarea en roadmap: ${item.name}`,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
