import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession, requireRole } from "@/lib/auth"
import { createAuditLog } from "@/lib/audit"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await getSession()
    const { id } = await params
    const docs = await prisma.expenseDocument.findMany({
      where: { expenseId: id },
      include: { uploadedBy: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { uploadedAt: "desc" },
    })
    return NextResponse.json({ data: docs })
  } catch { return NextResponse.json({ error: "Error interno" }, { status: 500 }) }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole("SUPER_ADMIN", "ADMIN", "OPERATOR")
    const { id } = await params
    const body = await request.json()

    const doc = await prisma.expenseDocument.create({
      data: {
        expenseId: id,
        fileName: body.fileName,
        fileSize: body.fileSize || 0,
        mimeType: body.mimeType || "application/octet-stream",
        url: body.url || "",
        key: body.key || "",
        uploadedById: user.id,
      },
    })

    await createAuditLog({
      userId: user.id, action: "UPDATE", entity: "Expense", entityId: id,
      description: `Documento adjuntado a gasto: ${body.fileName}`,
    })

    return NextResponse.json({ data: doc }, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") return NextResponse.json({ error: "No autenticado" }, { status: 401 })
      if (error.message === "Forbidden") return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole("SUPER_ADMIN", "ADMIN")
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const docId = searchParams.get("docId")
    if (!docId) return NextResponse.json({ error: "docId requerido" }, { status: 400 })

    const doc = await prisma.expenseDocument.findUnique({ where: { id: docId } })
    if (!doc) return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 })

    await prisma.expenseDocument.delete({ where: { id: docId } })

    await createAuditLog({
      userId: user.id, action: "DELETE", entity: "Expense", entityId: id,
      description: `Documento eliminado de gasto: ${doc.fileName}`,
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") return NextResponse.json({ error: "No autenticado" }, { status: 401 })
      if (error.message === "Forbidden") return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
