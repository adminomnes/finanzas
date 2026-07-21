import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, requireRole } from "@/lib/auth"
import { createAuditLog } from "@/lib/audit"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    const { id } = await params

    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        subsidiaries: { where: { isActive: true } },
        companySettings: true,
        _count: {
          select: {
            expenses: true,
            income: true,
            invoices: true,
          },
        },
      },
    })

    if (!company) {
      return NextResponse.json(
        { error: "Empresa no encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: company })
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 })
      }
    }
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole("SUPER_ADMIN", "ADMIN")
    const { id } = await params
    const body = await request.json()

    const existing = await prisma.company.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: "Empresa no encontrada" },
        { status: 404 }
      )
    }

    if (body.rut && body.rut !== existing.rut) {
      const duplicateRut = await prisma.company.findUnique({
        where: { rut: body.rut },
      })
      if (duplicateRut) {
        return NextResponse.json(
          { error: "El RUT ya está registrado por otra empresa" },
          { status: 400 }
        )
      }
    }

    const allowedFields = [
      "name", "businessName", "fantasyName", "rut", "giro",
      "address", "city", "region", "country", "phone", "email",
      "website", "logo", "currency", "parentCompanyId",
    ]

    const updateData: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    const company = await prisma.company.update({
      where: { id },
      data: updateData,
    })

    await createAuditLog({
      userId: user.id,
      action: "UPDATE",
      module: "MULTIEMPRESA",
      entity: "Company",
      entityId: id,
      description: `Empresa actualizada: ${company.name}`,
      oldValue: {
        name: existing.name,
        rut: existing.rut,
        businessName: existing.businessName,
        fantasyName: existing.fantasyName,
      },
      newValue: updateData,
    })

    return NextResponse.json({ data: company })
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 })
      }
      if (error.message === "Forbidden") {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 })
      }
    }
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole("SUPER_ADMIN")
    const { id } = await params

    const existing = await prisma.company.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: "Empresa no encontrada" },
        { status: 404 }
      )
    }

    if (!existing.isActive) {
      return NextResponse.json(
        { error: "La empresa ya está desactivada" },
        { status: 400 }
      )
    }

    const company = await prisma.company.update({
      where: { id },
      data: { isActive: false },
    })

    await createAuditLog({
      userId: user.id,
      action: "SOFT_DELETE",
      module: "MULTIEMPRESA",
      entity: "Company",
      entityId: id,
      description: `Empresa desactivada: ${existing.name} (${existing.rut})`,
      oldValue: { isActive: true },
      newValue: { isActive: false },
    })

    return NextResponse.json({ data: company })
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 })
      }
      if (error.message === "Forbidden") {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 })
      }
    }
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
