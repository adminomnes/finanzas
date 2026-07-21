import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth"
import { createAuditLog } from "@/lib/audit"

export async function GET() {
  try {
    await requireRole("SUPER_ADMIN")
    const versions = await prisma.developmentVersion.findMany({
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json({ data: versions })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole("SUPER_ADMIN")
    const body = await request.json()
    const { version, type, releaseDate, description, isCurrent } = body

    if (isCurrent) {
      await prisma.developmentVersion.updateMany({
        where: { isCurrent: true },
        data: { isCurrent: false },
      })
    }

    const newVersion = await prisma.developmentVersion.create({
      data: {
        version,
        type,
        releaseDate: releaseDate ? new Date(releaseDate) : null,
        description,
        isCurrent: isCurrent || false,
      },
    })

    await createAuditLog({
      userId: user.id,
      action: "CREATE",
      module: "DESARROLLO",
      entity: "DevelopmentVersion",
      entityId: newVersion.id,
      description: `Creación de versión de desarrollo: ${version}`,
    })

    return NextResponse.json({ data: newVersion }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
