"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Shield, Search, ChevronDown, ChevronUp } from "lucide-react"
import { formatDate } from "@/lib/utils"

interface AuditEntry {
  id: string
  action: string
  entity: string
  entityId: string | null
  description: string
  oldValue: unknown
  newValue: unknown
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

const actionLabels: Record<string, string> = {
  CREATE: "Creación",
  UPDATE: "Modificación",
  DELETE: "Eliminación",
  LOGIN: "Inicio Sesión",
  LOGIN_FAILED: "Intento Fallido",
  LOGOUT: "Cierre Sesión",
  EXPORT: "Exportación",
  PERMISSION_CHANGE: "Cambio Permisos",
  PASSWORD_CHANGE: "Cambio Contraseña",
}

const actionVariants: Record<string, "success" | "warning" | "danger" | "info" | "default"> = {
  CREATE: "success",
  UPDATE: "info",
  DELETE: "danger",
  LOGIN: "success",
  LOGIN_FAILED: "danger",
  LOGOUT: "default",
  EXPORT: "warning",
  PERMISSION_CHANGE: "warning",
  PASSWORD_CHANGE: "info",
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/audit?page=${page}&limit=30`)
      if (res.ok) {
        const data = await res.json()
        setLogs(data.data)
        setTotalPages(data.totalPages)
      }
    } catch {
      console.error("Error fetching audit logs")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [page])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-[#F0FDF4]">
          <Shield className="h-5 w-5 text-[#16A34A]" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[#1E293B]">Auditoría</h2>
          <p className="text-sm text-[#64748B]">
            Registro completo de actividades del sistema
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-[#94A3B8]">Cargando registros...</div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center">
              <Shield className="h-12 w-12 text-[#E2E8F0] mx-auto mb-3" />
              <p className="text-[#64748B]">No hay registros de auditoría</p>
            </div>
          ) : (
            <div className="divide-y divide-[#E2E8F0]">
              {logs.map((log) => (
                <div key={log.id} className="hover:bg-[#F8FAFC] transition-colors">
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer"
                    onClick={() =>
                      setExpandedId(expandedId === log.id ? null : log.id)
                    }
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <Badge variant={actionVariants[log.action] || "default"}>
                        {actionLabels[log.action] || log.action}
                      </Badge>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[#1E293B] truncate">
                          {log.description}
                        </p>
                        <p className="text-xs text-[#94A3B8] mt-0.5">
                          {log.user.firstName} {log.user.lastName} &middot;{" "}
                          {log.entity}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs text-[#94A3B8]">
                        {formatDate(log.createdAt)}
                      </span>
                      {expandedId === log.id ? (
                        <ChevronUp className="h-4 w-4 text-[#94A3B8]" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-[#94A3B8]" />
                      )}
                    </div>
                  </div>
                  {expandedId === log.id && (
                    <div className="px-4 pb-4 space-y-2">
                      <div className="grid grid-cols-2 gap-4 p-3 rounded-lg bg-[#F8FAFC] text-xs">
                        <div>
                          <span className="text-[#94A3B8]">ID Registro:</span>
                          <p className="text-[#1E293B] font-mono">{log.entityId}</p>
                        </div>
                        <div>
                          <span className="text-[#94A3B8]">IP:</span>
                          <p className="text-[#1E293B]">{log.ipAddress || "N/A"}</p>
                        </div>
                        <div>
                          <span className="text-[#94A3B8]">Usuario:</span>
                          <p className="text-[#1E293B]">{log.user.email}</p>
                        </div>
                        <div>
                          <span className="text-[#94A3B8]">User Agent:</span>
                          <p className="text-[#1E293B] truncate max-w-[300px]">
                            {log.userAgent || "N/A"}
                          </p>
                        </div>
                      </div>
                      {log.oldValue !== null && (
                        <div>
                          <p className="text-xs font-medium text-[#94A3B8] mb-1">
                            Valor Anterior
                          </p>
                          <pre className="text-xs bg-[#F1F5F9] p-2 rounded-lg overflow-x-auto">
                            {JSON.stringify(log.oldValue, null, 2)}
                          </pre>
                        </div>
                      )}
                      {log.newValue !== null && (
                        <div>
                          <p className="text-xs font-medium text-[#94A3B8] mb-1">
                            Valor Nuevo
                          </p>
                          <pre className="text-xs bg-[#F1F5F9] p-2 rounded-lg overflow-x-auto">
                            {JSON.stringify(log.newValue, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
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
                  onClick={() => setPage((p) => p - 1)}
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
