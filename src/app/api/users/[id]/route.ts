import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword, getSession, requireRole } from "@/lib/auth"
import { createAuditLog } from "@/lib/audit"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireRole("SUPER_ADMIN", "ADMIN")
    const { id } = await params
    const body = await request.json()

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      )
    }

    if (
      currentUser.role === "ADMIN" &&
      (user.role === "SUPER_ADMIN" || user.role === "ADMIN")
    ) {
      return NextResponse.json(
        { error: "No puedes modificar este usuario" },
        { status: 403 }
      )
    }

    if (body.role === "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "No puedes asignar rol Super Admin" },
        { status: 403 }
      )
    }

    const updateData: Record<string, unknown> = {}

    if (body.firstName) updateData.firstName = body.firstName
    if (body.lastName) updateData.lastName = body.lastName
    if (body.email) updateData.email = body.email
    if (body.role) updateData.role = body.role
    if (typeof body.isActive === "boolean") updateData.isActive = body.isActive
    if (body.password) {
      updateData.passwordHash = await hashPassword(body.password)
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
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
      action: "UPDATE",
      entity: "User",
      entityId: id,
      description: `Actualización de usuario: ${user.email}`,
      oldValue: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
      },
      newValue: updateData,
    })

    return NextResponse.json({ data: updated })
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

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireRole("SUPER_ADMIN")
    const { id } = await params

    if (id === currentUser.id) {
      return NextResponse.json(
        { error: "No puedes eliminarte a ti mismo" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      )
    }

    await prisma.user.delete({ where: { id } })

    await createAuditLog({
      userId: currentUser.id,
      action: "DELETE",
      entity: "User",
      entityId: id,
      description: `Eliminación de usuario: ${user.email}`,
      oldValue: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    })

    return NextResponse.json({ success: true })
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
