"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Modal } from "@/components/ui/modal"
import { useAuth } from "@/store/auth"
import { Users, Plus, Shield, UserCog, User } from "lucide-react"
import toast from "react-hot-toast"

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  isActive: boolean
  mustChangePwd: boolean
  lastLogin: string | null
  createdAt: string
}

const roleIcons: Record<string, React.ElementType> = {
  SUPER_ADMIN: Shield,
  ADMIN: UserCog,
  OPERATOR: User,
}

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Administrador",
  OPERATOR: "Operador",
}

export default function UsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "OPERATOR",
  })

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users")
      if (res.ok) {
        const data = await res.json()
        setUsers(data.data)
      }
    } catch {
      toast.error("Error al cargar usuarios")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Error al crear usuario")
        return
      }
      toast.success("Usuario creado exitosamente")
      setShowModal(false)
      setForm({ email: "", password: "", firstName: "", lastName: "", role: "OPERATOR" })
      fetchUsers()
    } catch {
      toast.error("Error de conexión")
    }
  }

  const toggleActive = async (userId: string, currentState: boolean) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentState }),
      })
      if (res.ok) {
        toast.success(`Usuario ${currentState ? "desactivado" : "activado"}`)
        fetchUsers()
      }
    } catch {
      toast.error("Error al actualizar usuario")
    }
  }

  const canManage = currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "ADMIN"
  const canCreateAdmin = currentUser?.role === "SUPER_ADMIN"

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#EFF6FF]">
            <Users className="h-5 w-5 text-[#2563EB]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#1E293B]">Usuarios</h2>
            <p className="text-sm text-[#64748B]">Gestión de usuarios del sistema</p>
          </div>
        </div>
        {canManage && (
          <Button onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4" />
            Nuevo Usuario
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-[#94A3B8]">Cargando usuarios...</div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="h-12 w-12 text-[#E2E8F0] mx-auto mb-3" />
              <p className="text-[#64748B]">No hay usuarios registrados</p>
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
                  {users.map((u) => {
                    const RoleIcon = roleIcons[u.role] || User
                    return (
                      <tr key={u.id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#2563EB]/10 flex items-center justify-center">
                              <RoleIcon className="h-4 w-4 text-[#2563EB]" />
                            </div>
                            <span className="text-sm font-medium text-[#1E293B]">
                              {u.firstName} {u.lastName}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-[#64748B]">{u.email}</td>
                        <td className="px-4 py-3">
                          <Badge variant={u.role === "SUPER_ADMIN" ? "info" : u.role === "ADMIN" ? "warning" : "default"}>
                            {roleLabels[u.role]}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={u.isActive ? "success" : "danger"}>
                            {u.isActive ? "Activo" : "Inactivo"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-[#64748B]">
                          {u.lastLogin
                            ? new Date(u.lastLogin).toLocaleDateString("es-CL")
                            : "Nunca"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {canManage && currentUser?.id !== u.id && (
                            <button
                              onClick={() => toggleActive(u.id, u.isActive)}
                              className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors ${
                                u.isActive
                                  ? "text-[#EF4444] hover:bg-[#FEF2F2]"
                                  : "text-[#22C55E] hover:bg-[#F0FDF4]"
                              }`}
                            >
                              {u.isActive ? "Desactivar" : "Activar"}
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nuevo Usuario">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              id="firstName"
              label="Nombre"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              required
            />
            <Input
              id="lastName"
              label="Apellido"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              required
            />
          </div>
          <Input
            id="email"
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <Input
            id="password"
            label="Contraseña"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <Select
            id="role"
            label="Rol"
            options={[
              ...(canCreateAdmin ? [{ value: "ADMIN", label: "Administrador" }] : []),
              { value: "OPERATOR", label: "Usuario Operativo" },
            ]}
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          />
          <div className="flex items-center gap-3 pt-2">
            <Button type="submit">Crear Usuario</Button>
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
