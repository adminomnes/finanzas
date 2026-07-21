import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword, getSession, requireRole } from "@/lib/auth"
import { createAuditLog } from "@/lib/audit"

export async function GET() {
  try {
    await requireRole("SUPER_ADMIN", "ADMIN")

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        mustChangePwd: true,
        lastLogin: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ data: users })
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 })
      }
      if (error.message === "Forbidden") {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 })
      }
    }
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await requireRole("SUPER_ADMIN", "ADMIN")
    const body = await request.json()

    const { email, password, firstName, lastName, role } = body

    if (!email || !password || !firstName || !lastName || !role) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 }
      )
    }

    if (role === "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "No puedes crear un Super Admin" },
        { status: 403 }
      )
    }

    if (currentUser.role === "ADMIN" && role === "ADMIN") {
      return NextResponse.json(
        { error: "No puedes crear otro administrador" },
        { status: 403 }
      )
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: "El email ya está registrado" },
        { status: 400 }
      )
    }

    const passwordHash = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role,
        mustChangePwd: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    })

    await createAuditLog({
      userId: currentUser.id,
      action: "CREATE",
      entity: "User",
      entityId: user.id,
      description: `Creación de usuario: ${email} (${role})`,
      newValue: { email, firstName, lastName, role },
    })

    return NextResponse.json({ data: user }, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 })
      }
      if (error.message === "Forbidden") {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 })
      }
    }
    const errMsg = error instanceof Error ? error.message : "Error desconocido"
    return NextResponse.json(
      { error: `Error interno: ${errMsg}` },
      { status: 500 }
    )
  }
}
