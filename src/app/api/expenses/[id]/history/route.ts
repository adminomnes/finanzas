import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await getSession()
    const { id } = await params

    const history = await prisma.expenseStatusHistory.findMany({
      where: { expenseId: id },
      include: { changedBy: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ data: history })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
