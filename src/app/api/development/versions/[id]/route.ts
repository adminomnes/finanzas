import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth"
import { createAuditLog } from "@/lib/audit"

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole("SUPER_ADMIN")
    const { id } = await props.params
    const body = await request.json()

    // If marking as current, unset all others first
    if (body.isCurrent) {
      await prisma.developmentVersion.updateMany({
        where: { isCurrent: true },
        data: { isCurrent: false },
      })
    }

    const version = await prisma.developmentVersion.update({
      where: { id },
      data: {
        ...body,
        releaseDate: body.releaseDate ? new Date(body.releaseDate) : undefined,
      },
    })

    await createAuditLog({
      userId: user.id,
      action: "UPDATE",
      module: "DESARROLLO",
      entity: "DevelopmentVersion",
      entityId: id,
      description: `Actualización de versión: ${version.version}`,
    })

    return NextResponse.json({ data: version })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole("SUPER_ADMIN")
    const { id } = await props.params

    const version = await prisma.developmentVersion.delete({
      where: { id },
    })

    await createAuditLog({
      userId: user.id,
      action: "DELETE",
      module: "DESARROLLO",
      entity: "DevelopmentVersion",
      entityId: id,
      description: `Eliminación de versión: ${version.version}`,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
