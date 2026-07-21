"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import {
  ScrollText, Search, Filter, Download, FileSpreadsheet,
  FileText, ChevronRight, Clock, AlertTriangle,
  Eye,
} from "lucide-react"
import { formatDate } from "@/lib/utils"

interface AuditEntry {
  id: string
  auditId: string
  action: string
  module: string | null
  entity: string
  entityId: string | null
  description: string
  role: string | null
  browser: string | null
  os: string | null
  device: string | null
  ipAddress: string | null
  oldValue: unknown
  newValue: unknown
  createdAt: string
  user: { id: string; firstName: string; lastName: string; email: string; role: string }
}

const actionLabels: Record<string, string> = {
  CREATE: "Creación", UPDATE: "Modificación", DELETE: "Eliminación",
  LOGIN: "Inicio Sesión", LOGIN_FAILED: "Fallo Login", LOGOUT: "Cierre",
  PERMISSION_CHANGE: "Cambio Permisos", PASSWORD_CHANGE: "Cambio Clave",
  PASSWORD_RESET: "Reset Clave", ACCOUNT_LOCK: "Bloqueo",
  APPROVE: "Aprobación", REJECT: "Rechazo", EXPORT: "Exportación",
}

const moduleColors: Record<string, string> = {
  USUARIOS: "text-[#2563EB] bg-[#EFF6FF]",
  SEGURIDAD: "text-[#DC2626] bg-[#FEF2F2]",
  FINANZAS: "text-[#16A34A] bg-[#F0FDF4]",
  PROVEEDORES: "text-[#8B5CF6] bg-[#F5F3FF]",
  CONFIGURACION: "text-[#F59E0B] bg-[#FFFBEB]",
  AUDITORIA: "text-[#64748B] bg-[#F1F5F9]",
}

export default function AuditLogsPage() {
  const router = useRouter()
  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedLog, setSelectedLog] = useState<AuditEntry | null>(null)

  const [filters, setFilters] = useState({
    action: "", module: "", userId: "", entity: "", search: "",
    startDate: "", endDate: "", role: "",
  })

  const limit = 25

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v) })

      const res = await fetch(`/api/auditoria?${params}`)
      if (res.ok) {
        const d = await res.json()
        setLogs(d.data)
        setTotal(d.total)
        setTotalPages(d.totalPages)
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [page, filters])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const handleExport = (format: string) => {
    const params = new URLSearchParams({ format })
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v) })
    window.open(`/api/auditoria/export?${params}`, "_blank")
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#F0FDF4]">
            <ScrollText className="h-5 w-5 text-[#16A34A]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#1E293B]">Registro de Eventos</h2>
            <p className="text-sm text-[#64748B]">{total} eventos registrados</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4" /> Filtros
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport("xlsx")}><FileSpreadsheet className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => handleExport("pdf")}><FileText className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => handleExport("csv")}><Download className="h-4 w-4" /></Button>
        </div>
      </div>

      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="grid gap-3 md:grid-cols-4">
              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1">Búsqueda</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                  <input type="text" placeholder="Buscar en descripción..." className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                    value={filters.search} onChange={(e) => { setFilters({ ...filters, search: e.target.value }); setPage(1) }} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1">Acción</label>
                <select className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm"
                  value={filters.action} onChange={(e) => { setFilters({ ...filters, action: e.target.value }); setPage(1) }}>
                  <option value="">Todas</option>
                  {Object.entries(actionLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1">Módulo</label>
                <select className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm"
                  value={filters.module} onChange={(e) => { setFilters({ ...filters, module: e.target.value }); setPage(1) }}>
                  <option value="">Todos</option>
                  <option value="USUARIOS">Usuarios</option>
                  <option value="SEGURIDAD">Seguridad</option>
                  <option value="FINANZAS">Finanzas</option>
                  <option value="PROVEEDORES">Proveedores</option>
                  <option value="CONFIGURACION">Configuración</option>
                  <option value="AUDITORIA">Auditoría</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1">Entidad</label>
                <select className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm"
                  value={filters.entity} onChange={(e) => { setFilters({ ...filters, entity: e.target.value }); setPage(1) }}>
                  <option value="">Todas</option>
                  <option value="User">Usuario</option>
                  <option value="Expense">Gasto</option>
                  <option value="Income">Ingreso</option>
                  <option value="Supplier">Proveedor</option>
                  <option value="Setting">Configuración</option>
                  <option value="Role">Rol</option>
                  <option value="Session">Sesión</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1">Fecha Desde</label>
                <input type="date" className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm"
                  value={filters.startDate} onChange={(e) => { setFilters({ ...filters, startDate: e.target.value }); setPage(1) }} />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1">Fecha Hasta</label>
                <input type="date" className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm"
                  value={filters.endDate} onChange={(e) => { setFilters({ ...filters, endDate: e.target.value }); setPage(1) }} />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1">Rol</label>
                <select className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm"
                  value={filters.role} onChange={(e) => { setFilters({ ...filters, role: e.target.value }); setPage(1) }}>
                  <option value="">Todos</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="ADMIN">Administrador</option>
                  <option value="OPERATOR">Operador</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button variant="outline" size="sm" onClick={() => {
                  setFilters({ action: "", module: "", userId: "", entity: "", search: "", startDate: "", endDate: "", role: "" })
                  setPage(1)
                }}>
                  Limpiar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-[#94A3B8]">Cargando...</div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center">
              <ScrollText className="h-12 w-12 text-[#E2E8F0] mx-auto mb-3" />
              <p className="text-[#64748B]">No se encontraron eventos</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E2E8F0]">
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase">ID</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase">Fecha/Hora</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase">Usuario</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase">Rol</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase">Módulo</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase">Acción</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase">Descripción</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono text-[#94A3B8]">{log.auditId}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-[#1E293B]">
                          {formatDate(log.createdAt)}
                        </div>
                        <div className="text-xs text-[#94A3B8]">
                          {new Date(log.createdAt).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#1E293B]">
                        {log.user.firstName} {log.user.lastName}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={log.role === "SUPER_ADMIN" ? "info" : log.role === "ADMIN" ? "warning" : "default"}>
                          {log.role === "SUPER_ADMIN" ? "Super Admin" : log.role === "ADMIN" ? "Admin" : "Operador"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {log.module && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${moduleColors[log.module] || "text-[#64748B] bg-[#F1F5F9]"}`}>
                            {log.module}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={
                          log.action === "LOGIN" || log.action === "CREATE" ? "success" :
                          log.action === "LOGIN_FAILED" || log.action === "DELETE" || log.action === "ACCOUNT_LOCK" ? "danger" :
                          log.action === "UPDATE" || log.action === "PERMISSION_CHANGE" ? "warning" : "info"
                        }>
                          {actionLabels[log.action] || log.action}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#64748B] max-w-[250px] truncate">
                        {log.description}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => router.push(`/auditoria/${log.id}`)}
                          className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#2563EB] hover:bg-[#EFF6FF] transition-colors"
                          title="Ver detalle">
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
                Mostrando {(page - 1) * limit + 1}-{Math.min(page * limit, total)} de {total}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Anterior
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
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
