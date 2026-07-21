import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth"
import { createAuditLog } from "@/lib/audit"
import type { RoleType } from "@prisma/client"

export async function GET() {
  try {
    await requireRole("SUPER_ADMIN", "ADMIN")

    const permissions = await prisma.permission.findMany({
      orderBy: [{ module: "asc" }, { name: "asc" }],
    })

    const rolePermissions = await prisma.rolePermission.findMany()

    const roles = ["SUPER_ADMIN", "ADMIN", "OPERATOR"].map((role) => {
      const permKeys = rolePermissions
        .filter((rp) => rp.role === role)
        .map((rp) => rp.permissionId)

      return {
        role,
        permissions: permKeys,
      }
    })

    return NextResponse.json({
      data: { roles, permissions, rolePermissions },
    })
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") return NextResponse.json({ error: "No autenticado" }, { status: 401 })
      if (error.message === "Forbidden") return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireRole("SUPER_ADMIN")
    const { role, permissions: permissionIds } = await request.json()

    if (!role || !Array.isArray(permissionIds)) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
    }

    await prisma.rolePermission.deleteMany({ where: { role: role as RoleType } })

    for (const permissionId of permissionIds) {
      await prisma.rolePermission.create({
        data: { role: role as RoleType, permissionId },
      })
    }

    await createAuditLog({
      userId: user.id,
      action: "PERMISSION_CHANGE",
      entity: "Role",
      entityId: role,
      description: `Permisos actualizados para el rol ${role}`,
      newValue: { role, permissions: permissionIds },
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
