import { prisma } from "./prisma"
import type { RoleType } from "@/types/prisma-enums"

export const PERMISSIONS = {
  EXPENSES_CREATE: { key: "expenses.create", name: "Crear Gastos", module: "Gastos" },
  EXPENSES_READ: { key: "expenses.read", name: "Ver Gastos", module: "Gastos" },
  EXPENSES_VIEW: { key: "expenses.view", name: "Dashboard Gastos", module: "Gastos" },
  EXPENSES_UPDATE: { key: "expenses.update", name: "Modificar Gastos", module: "Gastos" },
  EXPENSES_DELETE: { key: "expenses.delete", name: "Eliminar Gastos", module: "Gastos" },
  EXPENSES_APPROVE: { key: "expenses.approve", name: "Aprobar Gastos", module: "Gastos" },
  EXPENSES_REJECT: { key: "expenses.reject", name: "Rechazar Gastos", module: "Gastos" },
  EXPENSES_EXPORT: { key: "expenses.export", name: "Exportar Gastos", module: "Gastos" },

  INCOME_CREATE: { key: "income.create", name: "Crear Ingresos", module: "Ingresos" },
  INCOME_READ: { key: "income.read", name: "Ver Ingresos", module: "Ingresos" },
  INCOME_UPDATE: { key: "income.update", name: "Modificar Ingresos", module: "Ingresos" },
  INCOME_DELETE: { key: "income.delete", name: "Eliminar Ingresos", module: "Ingresos" },
  INCOME_VIEW: { key: "income.view", name: "Panel Ingresos", module: "Ingresos" },
  INCOME_APPROVE: { key: "income.approve", name: "Aprobar Facturas", module: "Ingresos" },
  INCOME_EXPORT: { key: "income.export", name: "Exportar Ingresos", module: "Ingresos" },

  CLIENTS_MANAGE: { key: "clients.manage", name: "Gestionar Clientes", module: "Clientes" },
  CLIENTS_READ: { key: "clients.read", name: "Ver Clientes", module: "Clientes" },

  INVOICES_CREATE: { key: "invoices.create", name: "Crear Facturas", module: "Facturación" },
  INVOICES_READ: { key: "invoices.read", name: "Ver Facturas", module: "Facturación" },
  INVOICES_UPDATE: { key: "invoices.update", name: "Modificar Facturas", module: "Facturación" },
  INVOICES_DELETE: { key: "invoices.delete", name: "Anular Facturas", module: "Facturación" },
  INVOICES_APPROVE: { key: "invoices.approve", name: "Emitir Facturas", module: "Facturación" },

  PAYMENTS_CREATE: { key: "payments.create", name: "Registrar Pagos", module: "Cobranza" },
  PAYMENTS_READ: { key: "payments.read", name: "Ver Pagos", module: "Cobranza" },

  USERS_CREATE: { key: "users.create", name: "Crear Usuarios", module: "Usuarios" },
  USERS_READ: { key: "users.read", name: "Ver Usuarios", module: "Usuarios" },
  USERS_UPDATE: { key: "users.update", name: "Modificar Usuarios", module: "Usuarios" },
  USERS_DELETE: { key: "users.delete", name: "Eliminar Usuarios", module: "Usuarios" },

  SUPPLIERS_CREATE: { key: "suppliers.create", name: "Crear Proveedores", module: "Proveedores" },
  SUPPLIERS_READ: { key: "suppliers.read", name: "Ver Proveedores", module: "Proveedores" },
  SUPPLIERS_UPDATE: { key: "suppliers.update", name: "Modificar Proveedores", module: "Proveedores" },
  SUPPLIERS_DELETE: { key: "suppliers.delete", name: "Eliminar Proveedores", module: "Proveedores" },

  CATEGORIES_CREATE: { key: "categories.create", name: "Crear Categorías", module: "Categorías" },
  CATEGORIES_READ: { key: "categories.read", name: "Ver Categorías", module: "Categorías" },
  CATEGORIES_UPDATE: { key: "categories.update", name: "Modificar Categorías", module: "Categorías" },

  COST_CENTERS_CREATE: { key: "cost-centers.create", name: "Crear Centros Costo", module: "Centros Costo" },
  COST_CENTERS_READ: { key: "cost-centers.read", name: "Ver Centros Costo", module: "Centros Costo" },

  COMPANIES_CREATE: { key: "companies.create", name: "Crear Empresas", module: "Empresas" },
  COMPANIES_READ: { key: "companies.read", name: "Ver Empresas", module: "Empresas" },

  AUDIT_READ: { key: "audit.read", name: "Ver Auditoría", module: "Auditoría" },
  AUDIT_VIEW: { key: "audit.view", name: "Panel Auditoría", module: "Auditoría" },
  AUDIT_EXPORT: { key: "audit.export", name: "Exportar Auditoría", module: "Auditoría" },

  REPORTS_READ: { key: "reports.read", name: "Ver Reportes", module: "Reportes" },
  REPORTS_EXPORT: { key: "reports.export", name: "Exportar Reportes", module: "Reportes" },

  SETTINGS_READ: { key: "settings.read", name: "Ver Configuración", module: "Configuración" },
  SETTINGS_UPDATE: { key: "settings.update", name: "Modificar Configuración", module: "Configuración" },
} as const

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]["key"]

export const ROLE_DEFAULT_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: Object.values(PERMISSIONS).map((p) => p.key),
  ADMIN: [
    PERMISSIONS.EXPENSES_CREATE.key,
    PERMISSIONS.EXPENSES_READ.key,
    PERMISSIONS.EXPENSES_VIEW.key,
    PERMISSIONS.EXPENSES_UPDATE.key,
    PERMISSIONS.EXPENSES_DELETE.key,
    PERMISSIONS.EXPENSES_APPROVE.key,
    PERMISSIONS.EXPENSES_REJECT.key,
    PERMISSIONS.EXPENSES_EXPORT.key,
    PERMISSIONS.INCOME_CREATE.key,
    PERMISSIONS.INCOME_READ.key,
    PERMISSIONS.INCOME_UPDATE.key,
    PERMISSIONS.INCOME_VIEW.key,
    PERMISSIONS.INCOME_APPROVE.key,
    PERMISSIONS.INCOME_EXPORT.key,
    PERMISSIONS.CLIENTS_MANAGE.key,
    PERMISSIONS.CLIENTS_READ.key,
    PERMISSIONS.INVOICES_CREATE.key,
    PERMISSIONS.INVOICES_READ.key,
    PERMISSIONS.INVOICES_UPDATE.key,
    PERMISSIONS.INVOICES_DELETE.key,
    PERMISSIONS.INVOICES_APPROVE.key,
    PERMISSIONS.PAYMENTS_CREATE.key,
    PERMISSIONS.PAYMENTS_READ.key,
    PERMISSIONS.SUPPLIERS_CREATE.key,
    PERMISSIONS.SUPPLIERS_READ.key,
    PERMISSIONS.SUPPLIERS_UPDATE.key,
    PERMISSIONS.CATEGORIES_CREATE.key,
    PERMISSIONS.CATEGORIES_READ.key,
    PERMISSIONS.CATEGORIES_UPDATE.key,
    PERMISSIONS.COST_CENTERS_CREATE.key,
    PERMISSIONS.COST_CENTERS_READ.key,
    PERMISSIONS.COMPANIES_CREATE.key,
    PERMISSIONS.COMPANIES_READ.key,
    PERMISSIONS.USERS_READ.key,
    PERMISSIONS.USERS_UPDATE.key,
    PERMISSIONS.USERS_DELETE.key,
    PERMISSIONS.AUDIT_READ.key,
    PERMISSIONS.AUDIT_VIEW.key,
    PERMISSIONS.AUDIT_EXPORT.key,
    PERMISSIONS.REPORTS_READ.key,
    PERMISSIONS.REPORTS_EXPORT.key,
  ],
  OPERATOR: [
    PERMISSIONS.EXPENSES_CREATE.key,
    PERMISSIONS.EXPENSES_READ.key,
    PERMISSIONS.INCOME_CREATE.key,
    PERMISSIONS.INCOME_READ.key,
    PERMISSIONS.INCOME_VIEW.key,
    PERMISSIONS.CLIENTS_MANAGE.key,
    PERMISSIONS.CLIENTS_READ.key,
    PERMISSIONS.INVOICES_CREATE.key,
    PERMISSIONS.INVOICES_READ.key,
    PERMISSIONS.PAYMENTS_CREATE.key,
    PERMISSIONS.PAYMENTS_READ.key,
    PERMISSIONS.SUPPLIERS_READ.key,
    PERMISSIONS.CATEGORIES_READ.key,
    PERMISSIONS.COST_CENTERS_READ.key,
    PERMISSIONS.COMPANIES_READ.key,
    PERMISSIONS.REPORTS_READ.key,
  ],
}

export async function seedPermissions() {
  for (const perm of Object.values(PERMISSIONS)) {
    await prisma.permission.upsert({
      where: { key: perm.key },
      update: { name: perm.name, module: perm.module, description: `Permiso para ${perm.name.toLowerCase()}` },
      create: {
        key: perm.key,
        name: perm.name,
        module: perm.module,
        description: `Permiso para ${perm.name.toLowerCase()}`,
      },
    })
  }

  const permissions = await prisma.permission.findMany()
  const permMap = new Map(permissions.map((p) => [p.key, p.id]))

  for (const [role, keys] of Object.entries(ROLE_DEFAULT_PERMISSIONS)) {
    const desired = new Set(keys)
    const existing = await prisma.rolePermission.findMany({
      where: { role: role as RoleType },
      select: { permissionId: true, permission: { select: { key: true } } },
    })
    const existingKeys = new Set(existing.map((rp) => rp.permission.key))
    const existingMap = new Map(existing.map((rp) => [rp.permission.key, rp.permissionId]))

    for (const key of desired) {
      if (!existingKeys.has(key)) {
        const permId = permMap.get(key)
        if (permId) {
          await prisma.rolePermission.create({
            data: { role: role as RoleType, permissionId: permId },
          })
        }
      }
    }

    for (const key of existingKeys) {
      if (!desired.has(key)) {
        const permId = existingMap.get(key)
        if (permId) {
          await prisma.rolePermission.deleteMany({
            where: { role: role as RoleType, permissionId: permId },
          })
        }
      }
    }
  }
}
