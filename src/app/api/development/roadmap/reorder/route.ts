import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    await requireRole("SUPER_ADMIN")
    const body = await request.json()
    const { items } = body // Array of { id, orderIndex }

    // Run in a transaction
    await prisma.$transaction(
      items.map((item: any) =>
        prisma.developmentRoadmap.update({
          where: { id: item.id },
          data: { orderIndex: item.orderIndex },
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
