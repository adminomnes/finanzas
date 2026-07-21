import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession, requireAuth, requireRole } from "@/lib/auth"
import { createAuditLog } from "@/lib/audit"

export async function GET() {
  try {
    const user = await requireAuth()
    const isSuperAdmin = user.role === "SUPER_ADMIN"

    const where: Record<string, unknown> = { isActive: true }
    if (!isSuperAdmin) {
      const companyIds = await prisma.companyUser.findMany({
        where: { userId: user.id, isActive: true },
        select: { companyId: true },
      })
      where.id = { in: companyIds.map((cu) => cu.companyId) }
    }

    const companies = await prisma.company.findMany({
      where,
      include: {
        _count: {
          select: {
            expenses: true,
            income: true,
            invoices: true,
          },
        },
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json({ data: companies })
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 })
      }
    }
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole("SUPER_ADMIN", "ADMIN")
    const body = await request.json()

    if (!body.name || !body.rut) {
      return NextResponse.json(
        { error: "Nombre y RUT son requeridos" },
        { status: 400 }
      )
    }

    const existing = await prisma.company.findUnique({ where: { rut: body.rut } })
    if (existing) {
      return NextResponse.json(
        { error: "El RUT ya está registrado" },
        { status: 400 }
      )
    }

    const company = await prisma.company.create({
      data: {
        name: body.name,
        businessName: body.businessName ?? null,
        fantasyName: body.fantasyName ?? null,
        rut: body.rut,
        giro: body.giro ?? null,
        address: body.address ?? null,
        city: body.city ?? null,
        region: body.region ?? null,
        country: body.country ?? "Chile",
        phone: body.phone ?? null,
        email: body.email ?? null,
        website: body.website ?? null,
        logo: body.logo ?? null,
        currency: body.currency ?? "CLP",
        parentCompanyId: body.parentCompanyId ?? null,
      },
    })

    await createAuditLog({
      userId: user.id,
      action: "CREATE",
      module: "MULTIEMPRESA",
      entity: "Company",
      entityId: company.id,
      description: `Empresa creada: ${company.name} (${company.rut})`,
      newValue: body,
    })

    return NextResponse.json({ data: company }, { status: 201 })
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
