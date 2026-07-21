"use client"

import React from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/store/auth"
import { Dropdown } from "@/components/ui/dropdown"
import { CompanySelector } from "./company-selector"
import styles from "./header.module.css"
import {
  User, Settings, KeyRound, LogOut,
  ChevronDown, Bell, Search, PlusCircle, HelpCircle
} from "lucide-react"

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/expenses": "Gastos",
  "/expenses/new": "Nuevo Gasto",
  "/income": "Ingresos",
  "/income/new": "Nuevo Ingreso",
  "/suppliers": "Proveedores",
  "/categories": "Categorías",
  "/cost-centers": "Centros de Costo",
  "/companies": "Empresas",
  "/users": "Usuarios",
  "/audit": "Auditoría",
  "/auditoria": "Auditoría",
  "/auditoria/logs": "Registro de Eventos",
  "/auditoria/accesos": "Logs de Acceso",
  "/reports": "Reportes",
  "/settings": "Configuración",
  "/admin": "Panel de Administración",
  "/admin/users": "Gestión de Usuarios",
  "/admin/roles": "Roles y Permisos",
  "/admin/settings": "Configuración del Sistema",
  "/admin/security": "Seguridad",
}

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  const title = Object.entries(pageTitles).find(([path]) =>
    pathname === path || pathname.startsWith(path + "/")
  )?.[1] || "Dashboard"

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  const dropdownItems = [
    {
      label: "Mi Perfil",
      icon: <User className="h-4 w-4" />,
      onClick: () => router.push("/settings"),
    },
    {
      label: "Cambiar Contraseña",
      icon: <KeyRound className="h-4 w-4" />,
      onClick: () => router.push("/settings"),
    },
    { label: "", icon: undefined, onClick: () => {}, divider: true },
    {
      label: "Cerrar Sesión",
      icon: <LogOut className="h-4 w-4" />,
      onClick: handleLogout,
      variant: "danger" as const,
    },
  ]

  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
        <h1 className={styles.pageTitle}>{title}</h1>
        <CompanySelector />
      </div>

      <div className={styles.searchContainer}>
        <Search className={styles.searchIcon} />
        <input 
          type="text" 
          placeholder="Buscar clientes, facturas, reportes..." 
          className={styles.searchInput}
        />
      </div>

      <div className={styles.rightSection}>
        <div className={styles.quickActions}>
          <button className={styles.iconButton} title="Nuevo Registro">
            <PlusCircle size={20} />
          </button>
          <button className={styles.iconButton} title="Ayuda">
            <HelpCircle size={20} />
          </button>
          <button className={styles.iconButton} title="Notificaciones">
            <Bell size={20} />
            <span className={styles.badge} />
          </button>
        </div>

        <Dropdown
          trigger={
            <div className={styles.userProfile}>
              <div className={styles.avatar}>
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </div>
              <div className={styles.userInfo}>
                <span className={styles.userName}>{user?.firstName}</span>
                <span className={styles.userRole}>{user?.email}</span>
              </div>
              <ChevronDown size={14} className="text-gray-400" />
            </div>
          }
          items={dropdownItems}
        />
      </div>
    </header>
  )
}
