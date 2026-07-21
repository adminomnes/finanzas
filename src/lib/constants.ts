export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  OPERATOR: "OPERATOR",
} as const

export type RoleType = (typeof ROLES)[keyof typeof ROLES]

export const ROLE_LABELS: Record<RoleType, string> = {
  SUPER_ADMIN: "Super Administrador",
  ADMIN: "Administrador",
  OPERATOR: "Usuario Operativo",
}

export const ROLE_HIERARCHY: Record<RoleType, number> = {
  SUPER_ADMIN: 100,
  ADMIN: 50,
  OPERATOR: 10,
}

export const EXPENSE_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED",
} as const

export const EXPENSE_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
  CANCELLED: "Anulado",
}

export const INCOME_STATUS = {
  PENDING: "PENDING",
  RECEIVED: "RECEIVED",
  CANCELLED: "CANCELLED",
} as const

export const INCOME_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  RECEIVED: "Recibido",
  CANCELLED: "Anulado",
}

export const NAV_ITEMS = {
  superAdmin: [
    { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
    { label: "Gastos", href: "/expenses", icon: "ArrowDownCircle" },
    { label: "Ingresos", href: "/ingresos", icon: "ArrowUpCircle" },
    { label: "  Clientes", href: "/ingresos/clientes", icon: "Users" },
    { label: "  Facturas", href: "/ingresos/facturas", icon: "ScrollText" },
    { label: "  Pagos", href: "/ingresos/pagos", icon: "ArrowUpCircle" },
    { label: "Proveedores", href: "/suppliers", icon: "Building2" },
    { label: "Categorías", href: "/categories", icon: "Tags" },
    { label: "Centros de Costo", href: "/cost-centers", icon: "Layers" },
    { label: "Empresas", href: "/companies", icon: "Building" },
    { label: "Administración", href: "/admin", icon: "ShieldCheck" },
    { label: "Auditoría", href: "/auditoria", icon: "ScrollText" },
    { label: "Reportes", href: "/reports", icon: "BarChart3" },
    { label: "  Flujo Caja", href: "/reports/flujo-caja", icon: "BarChart3" },
    { label: "  Resultados", href: "/reports/estado-resultados", icon: "BarChart3" },
    { label: "  Gastos", href: "/reports/gastos", icon: "BarChart3" },
    { label: "  Comparativo", href: "/reports/comparativo", icon: "BarChart3" },
  ],
  admin: [
    { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
    { label: "Gastos", href: "/expenses", icon: "ArrowDownCircle" },
    { label: "Ingresos", href: "/ingresos", icon: "ArrowUpCircle" },
    { label: "  Clientes", href: "/ingresos/clientes", icon: "Users" },
    { label: "  Facturas", href: "/ingresos/facturas", icon: "ScrollText" },
    { label: "  Pagos", href: "/ingresos/pagos", icon: "ArrowUpCircle" },
    { label: "Proveedores", href: "/suppliers", icon: "Building2" },
    { label: "Categorías", href: "/categories", icon: "Tags" },
    { label: "Centros de Costo", href: "/cost-centers", icon: "Layers" },
    { label: "Empresas", href: "/companies", icon: "Building" },
    { label: "Administración", href: "/admin", icon: "ShieldCheck" },
    { label: "Auditoría", href: "/auditoria", icon: "ScrollText" },
    { label: "Reportes", href: "/reports", icon: "BarChart3" },
    { label: "  Flujo Caja", href: "/reports/flujo-caja", icon: "BarChart3" },
    { label: "  Resultados", href: "/reports/estado-resultados", icon: "BarChart3" },
    { label: "  Gastos", href: "/reports/gastos", icon: "BarChart3" },
    { label: "  Comparativo", href: "/reports/comparativo", icon: "BarChart3" },
  ],
  operator: [
    { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
    { label: "Gastos", href: "/expenses", icon: "ArrowDownCircle" },
    { label: "Ingresos", href: "/ingresos", icon: "ArrowUpCircle" },
    { label: "  Clientes", href: "/ingresos/clientes", icon: "Users" },
    { label: "  Facturas", href: "/ingresos/facturas", icon: "ScrollText" },
    { label: "  Pagos", href: "/ingresos/pagos", icon: "ArrowUpCircle" },
    { label: "Proveedores", href: "/suppliers", icon: "Building2" },
    { label: "Categorías", href: "/categories", icon: "Tags" },
    { label: "Centros de Costo", href: "/cost-centers", icon: "Layers" },
    { label: "Empresas", href: "/companies", icon: "Building" },
    { label: "Reportes", href: "/reports", icon: "BarChart3" },
    { label: "  Flujo Caja", href: "/reports/flujo-caja", icon: "BarChart3" },
    { label: "  Resultados", href: "/reports/estado-resultados", icon: "BarChart3" },
    { label: "  Gastos", href: "/reports/gastos", icon: "BarChart3" },
    { label: "  Comparativo", href: "/reports/comparativo", icon: "BarChart3" },
  ],
}

export const COLORS = {
  primary: "#2563EB",
  secondary: "#14B8A6",
  success: "#22C55E",
  warning: "#F59E0B",
  error: "#EF4444",
  background: "#F5F7FA",
  card: "#FFFFFF",
  text: {
    primary: "#1E293B",
    secondary: "#64748B",
    muted: "#94A3B8",
  },
  border: "#E2E8F0",
}
