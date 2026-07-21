"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/store/auth"
import styles from "./sidebar.module.css"
import {
  LayoutDashboard,
  Wallet,
  ArrowDownToLine,
  ArrowUpToLine,
  Activity,
  LineChart,
  Users,
  Building2,
  FileText,
  CreditCard,
  PieChart,
  Settings,
  ShieldCheck,
  Building,
  UserCog,
  ChevronLeft,
  LogOut,
  Terminal
} from "lucide-react"

// Define the new grouped structure based on the prompt
const NAVIGATION_GROUPS = [
  {
    title: "Inicio",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }
    ]
  },
  {
    title: "Finanzas",
    items: [
      { label: "Gastos", href: "/expenses", icon: ArrowDownToLine },
      { label: "Ingresos", href: "/ingresos", icon: ArrowUpToLine },
      { label: "Flujo de Caja", href: "/reports/flujo-caja", icon: Activity },
      { label: "Resultados", href: "/reports/estado-resultados", icon: LineChart }
    ]
  },
  {
    title: "Comercial",
    items: [
      { label: "Clientes", href: "/ingresos/clientes", icon: Users },
      { label: "Proveedores", href: "/suppliers", icon: Building2 },
      { label: "Facturas", href: "/ingresos/facturas", icon: FileText },
      { label: "Pagos", href: "/ingresos/pagos", icon: CreditCard }
    ]
  },
  {
    title: "Reportes",
    items: [
      { label: "Reportes Generales", href: "/reports", icon: PieChart }
    ]
  },
  {
    title: "Administración",
    items: [
      { label: "Usuarios", href: "/admin", icon: UserCog }, // Mapping /admin to Users based on existing routes
      { label: "Empresas", href: "/companies", icon: Building },
      { label: "Auditoría", href: "/auditoria", icon: ShieldCheck },
      { label: "Configuración", href: "/settings", icon: Settings },
      { label: "Centro de Desarrollo", href: "/admin/development", icon: Terminal }
    ]
  }
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  if (!user) return null

  const groups = NAVIGATION_GROUPS.map(group => ({
    ...group,
    items: group.items.filter(item => 
      item.href !== "/admin/development" || user.role === "SUPER_ADMIN"
    )
  })).filter(group => group.items.length > 0);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/")

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : styles.sidebarExpanded}`}>
      
      <div className={`${styles.brand} ${collapsed ? styles.brandCollapsed : ""}`}>
        <div className={styles.logo}>
          <span className={styles.logoText}>OF</span>
        </div>
        {!collapsed && (
          <div className={styles.brandInfo}>
            <span className={styles.brandTitle}>OMNES FINANCE</span>
            <span className={styles.brandSubtitle}>Sistema Empresarial</span>
          </div>
        )}
      </div>

      <nav className={styles.nav}>
        {groups.map((group, groupIdx) => (
          <div key={group.title} className={styles.group}>
            {!collapsed && (
              <h4 className={styles.groupTitle}>{group.title}</h4>
            )}
            {collapsed && groupIdx > 0 && <div className={styles.groupDivider} />}
            
            {group.items.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.link} ${collapsed ? styles.linkCollapsed : ""} ${active ? styles.linkActive : ""}`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className={styles.icon} />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      <div className={styles.footer}>
        <div className={`${styles.userProfile} ${collapsed ? styles.userProfileCollapsed : ""}`}>
          <div className={styles.avatar}>
            <span className={styles.avatarText}>
              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
            </span>
          </div>
          {!collapsed && (
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user.firstName} {user.lastName}</span>
              <span className={styles.userRole}>
                {user.role === "SUPER_ADMIN" ? "Super Admin" : user.role === "ADMIN" ? "Administrador" : "Operador"}
              </span>
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <button 
            className={`${styles.actionButton} ${styles.logoutButton}`}
            onClick={() => logout()}
            title="Cerrar Sesión"
          >
            <LogOut className={styles.icon} />
            {!collapsed && <span className={styles.actionText}>Cerrar Sesión</span>}
          </button>
          
          <button 
            className={styles.collapseButton} 
            onClick={onToggle}
            title={collapsed ? "Expandir menú" : "Contraer menú"}
          >
            <ChevronLeft className={`${styles.icon} ${collapsed ? styles.iconRotated : ""}`} />
          </button>
        </div>
      </div>
      
    </aside>
  )
}
