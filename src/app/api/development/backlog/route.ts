import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth"
import { createAuditLog } from "@/lib/audit"

export async function GET() {
  try {
    await requireRole("SUPER_ADMIN")
    const backlog = await prisma.developmentBacklog.findMany({
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json({ data: backlog })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole("SUPER_ADMIN")
    const body = await request.json()
    const { title, description, priority, status, notes } = body

    const item = await prisma.developmentBacklog.create({
      data: {
        title,
        description,
        priority: priority || "MEDIA",
        status: status || "IDEA",
        notes,
      },
    })

    await createAuditLog({
      userId: user.id,
      action: "CREATE",
      module: "DESARROLLO",
      entity: "DevelopmentBacklog",
      entityId: item.id,
      description: `Creación de idea en backlog: ${title}`,
    })

    return NextResponse.json({ data: item }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
