import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession, requireRole } from "@/lib/auth"
import { createAuditLog } from "@/lib/audit"

export async function GET() {
  try {
    await getSession()
    const suppliers = await prisma.supplier.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    })
    return NextResponse.json({ data: suppliers })
  } catch {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole("SUPER_ADMIN", "ADMIN")
    const body = await request.json()

    const supplier = await prisma.supplier.create({
      data: {
        name: body.name,
        rut: body.rut,
        address: body.address,
        phone: body.phone,
        email: body.email,
        contact: body.contact,
      },
    })

    await createAuditLog({
      userId: user.id,
      action: "CREATE",
      entity: "Supplier",
      entityId: supplier.id,
      description: `Proveedor creado: ${body.name}`,
      newValue: body,
    })

    return NextResponse.json({ data: supplier }, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") return NextResponse.json({ error: "No autenticado" }, { status: 401 })
      if (error.message === "Forbidden") return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
