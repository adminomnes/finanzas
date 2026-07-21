import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth"
import { createAuditLog } from "@/lib/audit"

export async function GET() {
  try {
    await requireRole("SUPER_ADMIN")
    const changelogs = await prisma.developmentChangelog.findMany({
      include: { version: true },
      orderBy: { releaseDate: "desc" },
    })
    return NextResponse.json({ data: changelogs })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole("SUPER_ADMIN")
    const body = await request.json()
    const { releaseDate, description, features, fixes, securityChanges, versionId } = body

    const item = await prisma.developmentChangelog.create({
      data: {
        releaseDate: releaseDate ? new Date(releaseDate) : new Date(),
        description,
        features,
        fixes,
        securityChanges,
        versionId,
      },
    })

    await createAuditLog({
      userId: user.id,
      action: "CREATE",
      module: "DESARROLLO",
      entity: "DevelopmentChangelog",
      entityId: item.id,
      description: `Creación de changelog para versión ID: ${versionId}`,
    })

    return NextResponse.json({ data: item }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
