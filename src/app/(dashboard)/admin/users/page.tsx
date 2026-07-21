"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/store/auth"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Modal } from "@/components/ui/modal"
import { formatDate } from "@/lib/utils"
import { Users, Plus, Search, Shield, UserCog, User, KeyRound, XCircle, CheckCircle, Edit3 } from "lucide-react"
import toast from "react-hot-toast"

interface AppUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  isActive: boolean
  lastLogin: string | null
  createdAt: string
}

const roleIcons: Record<string, React.ElementType> = { SUPER_ADMIN: Shield, ADMIN: UserCog, OPERATOR: User }
const roleLabels: Record<string, string> = { SUPER_ADMIN: "Super Admin", ADMIN: "Administrador", OPERATOR: "Operador" }

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterRole, setFilterRole] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const perPage = 10

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const [editUser, setEditUser] = useState<AppUser | null>(null)
  const [resetPassword, setResetPassword] = useState("")
  const [createForm, setCreateForm] = useState({ firstName: "", lastName: "", email: "", password: "", role: "OPERATOR" })
  const [editForm, setEditForm] = useState({ firstName: "", lastName: "", email: "", role: "OPERATOR" })

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/users")
      if (res.ok) {
        const d = await res.json()
        setUsers(d.data)
        setTotalPages(Math.ceil(d.data.length / perPage))
      }
    } catch {
      toast.error("Error al cargar usuarios")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const filtered = users.filter((u) => {
    const matchSearch = !search || `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase())
    const matchRole = !filterRole || u.role === filterRole
    const matchStatus =
      !filterStatus ||
      (filterStatus === "active" && u.isActive) ||
      (filterStatus === "inactive" && !u.isActive)
    return matchSearch && matchRole && matchStatus
  })

  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  const adminCount = users.filter((u) => u.role === "ADMIN").length
  const canCreateAdmin = currentUser?.role === "SUPER_ADMIN" && adminCount < 2

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (createForm.role === "ADMIN" && !canCreateAdmin) {
      toast.error("Límite de administradores alcanzado (máximo 2)")
      return
    }
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      })
      const d = await res.json()
      if (!res.ok) { toast.error(d.error || "Error"); return }
      toast.success("Usuario creado correctamente")
      setShowCreateModal(false)
      setCreateForm({ firstName: "", lastName: "", email: "", password: "", role: "OPERATOR" })
      fetchUsers()
    } catch {
      toast.error("Error de conexión")
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editUser) return
    try {
      const res = await fetch(`/api/users/${editUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      })
      const d = await res.json()
      if (!res.ok) { toast.error(d.error || "Error"); return }
      toast.success("Usuario actualizado correctamente")
      setShowEditModal(false)
      setEditUser(null)
      fetchUsers()
    } catch {
      toast.error("Error de conexión")
    }
  }

  const handleResetPassword = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/reset-password`, { method: "POST" })
      const d = await res.json()
      if (!res.ok) { toast.error(d.error || "Error"); return }
      setResetPassword(d.tempPassword)
      setShowResetModal(true)
    } catch {
      toast.error("Error de conexión")
    }
  }

  const handleToggleActive = async (userId: string, current: boolean) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !current }),
      })
      if (res.ok) {
        toast.success(`Usuario ${current ? "desactivado" : "activado"}`)
        fetchUsers()
      }
    } catch {
      toast.error("Error al actualizar")
    }
  }

  const openEdit = (u: AppUser) => {
    setEditUser(u)
    setEditForm({ firstName: u.firstName, lastName: u.lastName, email: u.email, role: u.role })
    setShowEditModal(true)
  }

  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN"
  const isAdmin = currentUser?.role === "ADMIN"

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#EFF6FF]">
            <Users className="h-5 w-5 text-[#2563EB]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#1E293B]">Gestión de Usuarios</h2>
            <p className="text-sm text-[#64748B]">{filtered.length} usuarios registrados</p>
          </div>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4" /> Nuevo Usuario
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 relative min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
              <input type="text" placeholder="Buscar usuarios..." className="w-full pl-9 pr-4 py-2 rounded-lg border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
            </div>
            <select className="px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#64748B]"
              value={filterRole} onChange={(e) => { setFilterRole(e.target.value); setPage(1) }}>
              <option value="">Todos los roles</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="ADMIN">Administrador</option>
              <option value="OPERATOR">Operador</option>
            </select>
            <select className="px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#64748B]"
              value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }}>
              <option value="">Todos los estados</option>
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-[#94A3B8]">Cargando...</div>
          ) : paginated.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="h-12 w-12 text-[#E2E8F0] mx-auto mb-3" />
              <p className="text-[#64748B]">No se encontraron usuarios</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E2E8F0]">
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase">Usuario</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase">Rol</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase">Estado</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase">Último Acceso</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {paginated.map((u) => {
                    const RoleIcon = roleIcons[u.role] || User
                    return (
                      <tr key={u.id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#2563EB]/10 flex items-center justify-center">
                              <RoleIcon className="h-4 w-4 text-[#2563EB]" />
                            </div>
                            <span className="text-sm font-medium text-[#1E293B]">{u.firstName} {u.lastName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-[#64748B]">{u.email}</td>
                        <td className="px-4 py-3">
                          <Badge variant={u.role === "SUPER_ADMIN" ? "info" : u.role === "ADMIN" ? "warning" : "default"}>
                            {roleLabels[u.role]}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {u.isActive ? (
                            <Badge variant="success">Activo</Badge>
                          ) : (
                            <Badge variant="default">Inactivo</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#64748B]">
                          {u.lastLogin ? formatDate(u.lastLogin) : "Nunca"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => openEdit(u)}
                              className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#2563EB] hover:bg-[#EFF6FF] transition-colors"
                              title="Editar">
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleResetPassword(u.id)}
                              className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#F59E0B] hover:bg-[#FFFBEB] transition-colors"
                              title="Restablecer contraseña">
                              <KeyRound className="h-4 w-4" />
                            </button>
                            {currentUser?.id !== u.id && (
                              <button onClick={() => handleToggleActive(u.id, u.isActive)}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  u.isActive
                                    ? "text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#FEF2F2]"
                                    : "text-[#94A3B8] hover:text-[#22C55E] hover:bg-[#F0FDF4]"
                                }`}
                                title={u.isActive ? "Desactivar" : "Activar"}>
                                {u.isActive ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#E2E8F0]">
              <span className="text-sm text-[#64748B]">Mostrando {Math.min(filtered.length, (page - 1) * perPage + 1)}-{Math.min(page * perPage, filtered.length)} de {filtered.length}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Siguiente</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Nuevo Usuario">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Input id="cFirstName" label="Nombre" value={createForm.firstName} onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })} required />
            <Input id="cLastName" label="Apellido" value={createForm.lastName} onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })} required />
          </div>
          <Input id="cEmail" label="Email" type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} required />
          <Input id="cPassword" label="Contraseña" type="password" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} required />
          <Select id="cRole" label="Rol" value={createForm.role} onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
            options={[
              ...(isSuperAdmin ? [{ value: "ADMIN", label: "Administrador" }] : []),
              { value: "OPERATOR", label: "Usuario Operativo" },
            ]} />
          {createForm.role === "ADMIN" && !canCreateAdmin && (
            <p className="text-xs text-[#EF4444]">Límite de administradores alcanzado (máximo 2)</p>
          )}
          <div className="flex items-center gap-3 pt-2">
            <Button type="submit">Crear Usuario</Button>
            <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>Cancelar</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setEditUser(null) }} title="Editar Usuario">
        <form onSubmit={handleEdit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Input id="eFirstName" label="Nombre" value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} required />
            <Input id="eLastName" label="Apellido" value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} required />
          </div>
          <Input id="eEmail" label="Email" type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} required />
          {editUser?.role !== "SUPER_ADMIN" && isSuperAdmin && (
            <Select id="eRole" label="Rol" value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
              options={[
                { value: "ADMIN", label: "Administrador" },
                { value: "OPERATOR", label: "Usuario Operativo" },
              ]} />
          )}
          <div className="flex items-center gap-3 pt-2">
            <Button type="submit">Guardar Cambios</Button>
            <Button type="button" variant="outline" onClick={() => { setShowEditModal(false); setEditUser(null) }}>Cancelar</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showResetModal} onClose={() => { setShowResetModal(false); setResetPassword("") }} title="Contraseña Restablecida">
        <div className="space-y-4">
          <p className="text-sm text-[#64748B]">La contraseña ha sido restablecida exitosamente.</p>
          <div className="p-4 bg-[#FFFBEB] border border-[#FDE68A] rounded-lg">
            <p className="text-xs text-[#92400E] mb-1">Contraseña temporal:</p>
            <p className="text-lg font-mono font-bold text-[#1E293B]">{resetPassword}</p>
          </div>
          <p className="text-xs text-[#94A3B8]">El usuario deberá cambiar esta contraseña al iniciar sesión.</p>
          <Button onClick={() => { setShowResetModal(false); setResetPassword("") }}>Cerrar</Button>
        </div>
      </Modal>
    </div>
  )
}
