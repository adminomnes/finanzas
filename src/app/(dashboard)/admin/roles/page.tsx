"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/store/auth"
import { Shield, UserCog, User, Save, Lock, Check, X, ChevronDown, ChevronRight, ShieldCheck } from "lucide-react"
import toast from "react-hot-toast"

interface Permission {
  id: string
  key: string
  name: string
  module: string
}

interface RoleData {
  role: string
  permissions: string[]
}

interface RolesResponse {
  roles: RoleData[]
  permissions: Permission[]
  rolePermissions: { role: string; permissionId: string }[]
}

type ExpandedRoles = Record<string, boolean>
type SelectedPermissions = Record<string, string[]>

const roleConfig: Record<string, { label: string; description: string; icon: React.ElementType; color: string }> = {
  SUPER_ADMIN: { label: "Super Admin", description: "Acceso completo a todas las funciones del sistema", icon: Shield, color: "#2563EB" },
  ADMIN: { label: "Administrador", description: "Gestión operativa y administrativa del sistema", icon: UserCog, color: "#D97706" },
  OPERATOR: { label: "Operador", description: "Acceso limitado a operaciones del día a día", icon: User, color: "#16A34A" },
}

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Administrador",
  OPERATOR: "Operador",
}

export default function RolesPermissionsPage() {
  const { user: currentUser } = useAuth()
  const [data, setData] = useState<RolesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<ExpandedRoles>({})
  const [selected, setSelected] = useState<SelectedPermissions>({})
  const [modulesExpanded, setModulesExpanded] = useState<Record<string, Record<string, boolean>>>({})

  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN"

  const fetchRoles = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/roles")
      if (res.ok) {
        const json = await res.json()
        const d: RolesResponse = json.data
        setData(d)

        const initial: SelectedPermissions = {}
        for (const r of d.roles) {
          initial[r.role] = [...r.permissions]
        }
        setSelected(initial)

        const expandedInit: ExpandedRoles = {}
        const modulesInit: Record<string, Record<string, boolean>> = {}
        for (const r of d.roles) {
          expandedInit[r.role] = false
          const permModules = [...new Set(d.permissions.filter((p) => r.permissions.includes(p.id) || true).map((p) => p.module))]
          const modulesObj: Record<string, boolean> = {}
          for (const m of permModules) {
            modulesObj[m] = false
          }
          modulesInit[r.role] = modulesObj
        }
        setExpanded(expandedInit)
        setModulesExpanded(modulesInit)
      }
    } catch {
      toast.error("Error al cargar roles y permisos")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRoles()
  }, [fetchRoles])

  const getModules = (role: string) => {
    if (!data) return []
    return [...new Set(data.permissions.map((p) => p.module))]
  }

  const getPermissionsByModule = (module: string) => {
    if (!data) return []
    return data.permissions.filter((p) => p.module === module)
  }

  const isPermissionSelected = (role: string, permissionId: string) => {
    return selected[role]?.includes(permissionId) ?? false
  }

  const togglePermission = (role: string, permissionId: string) => {
    if (!isSuperAdmin) return
    setSelected((prev) => {
      const current = prev[role] || []
      const updated = current.includes(permissionId)
        ? current.filter((id) => id !== permissionId)
        : [...current, permissionId]
      return { ...prev, [role]: updated }
    })
  }

  const selectAllModule = (role: string, module: string, perms: Permission[]) => {
    if (!isSuperAdmin) return
    setSelected((prev) => {
      const current = prev[role] || []
      const allSelected = perms.every((p) => current.includes(p.id))
      const updated = allSelected
        ? current.filter((id) => !perms.some((p) => p.id === id))
        : [...current, ...perms.filter((p) => !current.includes(p.id)).map((p) => p.id)]
      return { ...prev, [role]: updated }
    })
  }

  const handleSave = async (role: string) => {
    if (!isSuperAdmin) return
    setSaving(role)
    try {
      const res = await fetch("/api/admin/roles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, permissions: selected[role] || [] }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || "Error al guardar permisos")
        return
      }
      toast.success(`Permisos actualizados para ${roleLabels[role] || role}`)
    } catch {
      toast.error("Error de conexión")
    } finally {
      setSaving(null)
    }
  }

  const toggleExpand = (role: string) => {
    setExpanded((prev) => ({ ...prev, [role]: !prev[role] }))
  }

  const toggleModule = (role: string, module: string) => {
    setModulesExpanded((prev) => ({
      ...prev,
      [role]: { ...prev[role], [module]: !prev[role]?.[module] },
    }))
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#EFF6FF]">
            <ShieldCheck className="h-5 w-5 text-[#2563EB]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#1E293B]">Roles y Permisos</h2>
            <p className="text-sm text-[#64748B]">Cargando configuración...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#EFF6FF]">
            <ShieldCheck className="h-5 w-5 text-[#2563EB]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#1E293B]">Roles y Permisos</h2>
            <p className="text-sm text-[#64748B]">
              Gestiona los permisos de cada rol del sistema
            </p>
          </div>
        </div>
        {!isSuperAdmin && (
          <Badge variant="warning" className="gap-1.5">
            <Lock className="h-3 w-3" />
            Solo lectura
          </Badge>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {data?.roles.map((roleData) => {
          const config = roleConfig[roleData.role]
          const Icon = config?.icon || Shield
          const isExpanded = expanded[roleData.role] ?? false
          const modules = getModules(roleData.role)
          const totalPerms = selected[roleData.role]?.length ?? 0
          const allPerms = data.permissions.length

          return (
            <Card key={roleData.role} className="flex flex-col">
              <CardContent className="p-0 flex flex-col h-full">
                <button
                  onClick={() => toggleExpand(roleData.role)}
                  className="flex items-center justify-between w-full p-5 hover:bg-[#F8FAFC] transition-colors border-b border-[#E2E8F0]"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${config?.color}15` }}
                    >
                      <Icon className="h-5 w-5" style={{ color: config?.color }} />
                    </div>
                    <div className="text-left">
                      <h3 className="text-sm font-semibold text-[#1E293B]">{config?.label || roleData.role}</h3>
                      <p className="text-xs text-[#64748B] mt-0.5">{config?.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="info" className="text-xs">
                      {totalPerms}/{allPerms}
                    </Badge>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-[#94A3B8]" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-[#94A3B8]" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="flex-1 p-5 space-y-4">
                    {modules.map((module) => {
                      const perms = getPermissionsByModule(module)
                      const isModuleExpanded = modulesExpanded[roleData.role]?.[module] ?? false
                      const selectedCount = perms.filter((p) => isPermissionSelected(roleData.role, p.id)).length
                      const allModuleSelected = perms.length > 0 && perms.every((p) => isPermissionSelected(roleData.role, p.id))

                      return (
                        <div key={module} className="border border-[#E2E8F0] rounded-lg overflow-hidden">
                          <button
                            onClick={() => toggleModule(roleData.role, module)}
                            className="flex items-center justify-between w-full px-4 py-3 bg-[#F8FAFC] hover:bg-[#F1F5F9] transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-[#1E293B]">{module}</span>
                              <Badge variant="default" className="text-xs">
                                {selectedCount}/{perms.length}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              {isSuperAdmin && perms.length > 0 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    selectAllModule(roleData.role, module, perms)
                                  }}
                                  className="text-xs text-[#2563EB] hover:underline"
                                >
                                  {allModuleSelected ? "Deseleccionar todos" : "Seleccionar todos"}
                                </button>
                              )}
                              {isModuleExpanded ? (
                                <ChevronDown className="h-4 w-4 text-[#94A3B8]" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-[#94A3B8]" />
                              )}
                            </div>
                          </button>

                          {isModuleExpanded && (
                            <div className="divide-y divide-[#E2E8F0]">
                              {perms.map((perm) => {
                                const selected = isPermissionSelected(roleData.role, perm.id)
                                return (
                                  <label
                                    key={perm.id}
                                    className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
                                      isSuperAdmin
                                        ? "hover:bg-[#F8FAFC] cursor-pointer"
                                        : "cursor-default"
                                    }`}
                                  >
                                    <button
                                      type="button"
                                      disabled={!isSuperAdmin}
                                      onClick={() => togglePermission(roleData.role, perm.id)}
                                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                        !isSuperAdmin
                                          ? "border-[#E2E8F0] cursor-not-allowed opacity-60"
                                          : selected
                                          ? "bg-[#2563EB] border-[#2563EB]"
                                          : "border-[#CBD5E1] hover:border-[#2563EB]"
                                      }`}
                                    >
                                      {selected && <Check className="h-3 w-3 text-white" />}
                                    </button>
                                    <span
                                      className={`text-sm ${
                                        selected ? "text-[#1E293B] font-medium" : "text-[#64748B]"
                                      }`}
                                    >
                                      {perm.name}
                                    </span>
                                    <span className="text-xs text-[#94A3B8] ml-auto">{perm.key}</span>
                                  </label>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                <div className="p-5 border-t border-[#E2E8F0] mt-auto">
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    disabled={!isSuperAdmin || saving === roleData.role}
                    isLoading={saving === roleData.role}
                    onClick={() => handleSave(roleData.role)}
                  >
                    {!isSuperAdmin ? (
                      <>
                        <Lock className="h-4 w-4" />
                        Sin permisos
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Guardar Cambios
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
