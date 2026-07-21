"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Shield, AlertTriangle, LogIn, LogOut, KeyRound, Lock, RefreshCw } from "lucide-react"
import { formatDate } from "@/lib/utils"
import toast from "react-hot-toast"

interface AuditEntry {
  id: string
  action: string
  entity: string
  description: string
  createdAt: string
  ipAddress: string | null
  userAgent: string | null
  user: { firstName: string; lastName: string; email: string }
}

const actionConfig: Record<string, { label: string; icon: React.ElementType; variant: "success" | "danger" | "warning" | "info" | "default" }> = {
  LOGIN: { label: "Inicio Sesión", icon: LogIn, variant: "success" },
  LOGIN_FAILED: { label: "Intento Fallido", icon: AlertTriangle, variant: "danger" },
  LOGOUT: { label: "Cierre Sesión", icon: LogOut, variant: "default" },
  PASSWORD_CHANGE: { label: "Cambio Contraseña", icon: KeyRound, variant: "info" },
  PASSWORD_RESET: { label: "Reset Contraseña", icon: KeyRound, variant: "warning" },
  ACCOUNT_LOCK: { label: "Bloqueo Cuenta", icon: Lock, variant: "danger" },
  PERMISSION_CHANGE: { label: "Cambio Permisos", icon: Shield, variant: "warning" },
}

export default function SecurityPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [stats, setStats] = useState({ totalUsers: 0, totalLogs: 0, recentFailed: 0 })
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [logsRes, userRes] = await Promise.all([
        fetch(`/api/audit?page=${page}&limit=20`),
        fetch("/api/users"),
      ])

      if (logsRes.ok) {
        const d = await logsRes.json()
        setLogs(d.data)
        setTotalPages(d.totalPages)
        setStats((s) => ({ ...s, totalLogs: d.total }))
      }
      if (userRes.ok) {
        const d = await userRes.json()
        setStats((s) => ({ ...s, totalUsers: d.data.length }))
      }

      const failedRes = await fetch("/api/audit?action=LOGIN_FAILED&limit=1")
      if (failedRes.ok) {
        const d = await failedRes.json()
        setStats((s) => ({ ...s, recentFailed: d.total }))
      }
    } catch {
      toast.error("Error al cargar datos de seguridad")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [page])

  const securityCards = [
    { label: "Total Usuarios", value: stats.totalUsers.toString(), icon: Shield, color: "text-[#2563EB]", bg: "bg-[#EFF6FF]" },
    { label: "Eventos Registrados", value: stats.totalLogs.toString(), icon: Shield, color: "text-[#14B8A6]", bg: "bg-[#F0FDF4]" },
    { label: "Intentos Fallidos", value: stats.recentFailed.toString(), icon: AlertTriangle, color: "text-[#EF4444]", bg: "bg-[#FEF2F2]" },
    { label: "Cambios Permisos", value: logs.filter((l) => l.action === "PERMISSION_CHANGE").length.toString(), icon: Lock, color: "text-[#F59E0B]", bg: "bg-[#FFFBEB]" },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#FEF2F2]">
            <Shield className="h-5 w-5 text-[#EF4444]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#1E293B]">Seguridad y Actividad</h2>
            <p className="text-sm text-[#64748B]">Monitoreo de seguridad del sistema</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="h-4 w-4" /> Actualizar
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {securityCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${card.bg}`}>
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
                <div>
                  <p className="text-xs text-[#64748B]">{card.label}</p>
                  <p className="text-lg font-bold text-[#1E293B]">{card.value}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-[#1E293B]">Actividad Reciente</h3>
          <p className="text-xs text-[#94A3B8]">Eventos de seguridad registrados</p>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-[#94A3B8]">Cargando...</div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-[#94A3B8]">Sin actividad registrada</div>
          ) : (
            <div className="divide-y divide-[#E2E8F0]">
              {logs.map((log) => {
                const config = actionConfig[log.action] || { label: log.action, icon: Shield, variant: "default" as const }
                const Icon = config.icon

                return (
                  <div key={log.id} className="flex items-start gap-4 p-4 hover:bg-[#F8FAFC] transition-colors">
                    <div className={`p-2 rounded-full ${
                      config.variant === "danger" ? "bg-[#FEF2F2]" :
                      config.variant === "warning" ? "bg-[#FFFBEB]" :
                      config.variant === "success" ? "bg-[#F0FDF4]" :
                      "bg-[#F1F5F9]"
                    }`}>
                      <Icon className={`h-4 w-4 ${
                        config.variant === "danger" ? "text-[#EF4444]" :
                        config.variant === "warning" ? "text-[#F59E0B]" :
                        config.variant === "success" ? "text-[#22C55E]" :
                        "text-[#64748B]"
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant={config.variant}>{config.label}</Badge>
                        <span className="text-xs text-[#94A3B8]">{formatDate(log.createdAt)}</span>
                      </div>
                      <p className="text-sm text-[#1E293B] mt-1">{log.description}</p>
                      <p className="text-xs text-[#94A3B8] mt-0.5">
                        {log.user.firstName} {log.user.lastName}
                        {log.ipAddress && ` · IP: ${log.ipAddress}`}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#E2E8F0]">
              <span className="text-sm text-[#64748B]">Página {page} de {totalPages}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Siguiente</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
