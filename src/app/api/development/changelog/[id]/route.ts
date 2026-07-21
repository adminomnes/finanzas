import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth"
import { createAuditLog } from "@/lib/audit"

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole("SUPER_ADMIN")
    const { id } = await props.params

    const item = await prisma.developmentChangelog.delete({
      where: { id },
    })

    await createAuditLog({
      userId: user.id,
      action: "DELETE",
      module: "DESARROLLO",
      entity: "DevelopmentChangelog",
      entityId: id,
      description: `Eliminación de changelog`,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
