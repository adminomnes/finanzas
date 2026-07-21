"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { Input } from "@/components/ui/input"
import { Plus, Search, Eye, Users, Building, Mail, Phone } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import toast from "react-hot-toast"

interface Client {
  id: string
  name: string
  rut: string
  type: "EMPRESA" | "PERSONA"
  contact: string | null
  email: string | null
  phone: string | null
  isActive: boolean
  invoicesCount: number
  totalBilled: number
  createdAt: string
}

export default function ClientsPage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchClients = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: "20" })
      if (search) params.set("search", search)
      if (typeFilter) params.set("type", typeFilter)
      if (statusFilter) params.set("status", statusFilter)

      const res = await fetch(`/api/income/clients?${params}`)
      if (res.ok) {
        const data = await res.json()
        setClients(data.data)
        setTotalPages(data.totalPages)
      }
    } catch {
      toast.error("Error al cargar clientes")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
  }, [page, typeFilter, statusFilter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchClients()
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#EFF6FF]">
            <Users className="h-5 w-5 text-[#2563EB]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#1E293B]">Clientes</h2>
            <p className="text-sm text-[#64748B]">
              Gestión de clientes empresariales
            </p>
          </div>
        </div>
        <Button onClick={() => router.push("/ingresos/clientes/nuevo")}>
          <Plus className="h-4 w-4" />
          Nuevo Cliente
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <form onSubmit={handleSearch} className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Buscar por nombre o RUT..."
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </form>
            <select
              className="px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value)
                setPage(1)
              }}
            >
              <option value="">Todos los tipos</option>
              <option value="EMPRESA">Empresa</option>
              <option value="PERSONA">Persona</option>
            </select>
            <select
              className="px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
            >
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
            <div className="p-12 text-center text-[#94A3B8]">
              Cargando clientes...
            </div>
          ) : clients.length === 0 ? (
            <EmptyState
              icon={<Users className="h-8 w-8" />}
              title="No hay clientes registrados"
              description="Cree su primer cliente para comenzar a facturar"
              action={
                <Button onClick={() => router.push("/ingresos/clientes/nuevo")}>
                  <Plus className="h-4 w-4" />
                  Nuevo Cliente
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E2E8F0]">
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Nombre</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">RUT</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Tipo</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Contacto</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Email</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Facturas</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Total Facturado</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Estado</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {clients.map((client) => (
                    <tr
                      key={client.id}
                      className="hover:bg-[#F8FAFC] transition-colors hover-card"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-[#1E293B]">
                        {client.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#64748B]">
                        {client.rut}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {client.type === "EMPRESA" ? (
                            <Building className="h-3.5 w-3.5 text-[#2563EB]" />
                          ) : (
                            <Users className="h-3.5 w-3.5 text-[#14B8A6]" />
                          )}
                          <span className="text-sm text-[#64748B]">
                            {client.type === "EMPRESA" ? "Empresa" : "Persona"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#64748B]">
                        {client.contact ? (
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-[#94A3B8]" />
                            {client.contact}
                          </div>
                        ) : (
                          <span className="text-[#CBD5E1]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#64748B]">
                        {client.email ? (
                          <div className="flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5 text-[#94A3B8]" />
                            {client.email}
                          </div>
                        ) : (
                          <span className="text-[#CBD5E1]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-[#64748B]">
                        {client.invoicesCount}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-right text-[#1E293B] financial-number">
                        {formatCurrency(client.totalBilled)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={client.isActive ? "success" : "default"}>
                          {client.isActive ? "Activo" : "Inactivo"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => router.push(`/ingresos/clientes/${client.id}`)}
                          className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#2563EB] hover:bg-[#EFF6FF] transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#E2E8F0]">
              <span className="text-sm text-[#64748B]">
                Página {page} de {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
