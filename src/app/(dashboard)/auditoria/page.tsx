"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ScrollText, Activity, AlertTriangle, LogIn, Users,
  ChevronRight, Clock, BarChart3, ShieldAlert,
  Download, FileSpreadsheet, FileText,
} from "lucide-react"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from "recharts"

interface Stat {
  totalActionsToday: number
  totalActions: number
  failedLoginsToday: number
  totalLoginAttempts: number
  recentActivity: {
    id: string; action: string; entity: string
    module: string | null; description: string
    createdAt: string
    user: { firstName: string; lastName: string }
  }[]
  actionCounts: { action: string; count: number }[]
  moduleCounts: { module: string | null; count: number }[]
  userActivity: { userId: string; name: string; count: number }[]
  dailyActivity: { date: string; count: number }[]
}

const actionLabels: Record<string, string> = {
  CREATE: "Creación", UPDATE: "Modificación", DELETE: "Eliminación",
  LOGIN: "Inicio Sesión", LOGIN_FAILED: "Fallo Login", LOGOUT: "Cierre",
  PERMISSION_CHANGE: "Permisos", PASSWORD_CHANGE: "Cambio Clave",
  PASSWORD_RESET: "Reset Clave", ACCOUNT_LOCK: "Bloqueo",
  APPROVE: "Aprobación", REJECT: "Rechazo", EXPORT: "Exportación",
}

const actionColors: Record<string, string> = {
  LOGIN: "text-[#16A34A]", LOGIN_FAILED: "text-[#DC2626]",
  CREATE: "text-[#2563EB]", UPDATE: "text-[#F59E0B]",
  DELETE: "text-[#DC2626]", PASSWORD_CHANGE: "text-[#8B5CF6]",
  PASSWORD_RESET: "text-[#EC4899]", ACCOUNT_LOCK: "text-[#EF4444]",
  PERMISSION_CHANGE: "text-[#14B8A6]",
}

export default function AuditDashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<Stat | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/auditoria/stats")
        if (res.ok) setStats(await res.json())
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    fetchStats()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-[#94A3B8]">Cargando panel de auditoría...</div>
  )

  const s = stats!

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#F0FDF4]">
            <ScrollText className="h-5 w-5 text-[#16A34A]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#1E293B]">Panel de Auditoría</h2>
            <p className="text-sm text-[#64748B]">Monitoreo completo de actividad del sistema</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push("/api/auditoria/export?format=xlsx")}>
            <FileSpreadsheet className="h-4 w-4" /> Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push("/api/auditoria/export?format=pdf")}>
            <FileText className="h-4 w-4" /> PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push("/api/auditoria/export?format=csv")}>
            <Download className="h-4 w-4" /> CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#EFF6FF]"><Activity className="h-5 w-5 text-[#2563EB]" /></div>
            <div>
              <p className="text-xs text-[#64748B]">Acciones Hoy</p>
              <p className="text-xl font-bold text-[#1E293B]">{s.totalActionsToday}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#F0FDF4]"><Users className="h-5 w-5 text-[#16A34A]" /></div>
            <div>
              <p className="text-xs text-[#64748B]">Usuarios Activos</p>
              <p className="text-xl font-bold text-[#1E293B]">{s.userActivity.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#FEF2F2]"><AlertTriangle className="h-5 w-5 text-[#DC2626]" /></div>
            <div>
              <p className="text-xs text-[#64748B]">Intentos Fallidos</p>
              <p className="text-xl font-bold text-[#1E293B]">{s.failedLoginsToday}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#FFFBEB]"><ShieldAlert className="h-5 w-5 text-[#F59E0B]" /></div>
            <div>
              <p className="text-xs text-[#64748B]">Total Eventos</p>
              <p className="text-xl font-bold text-[#1E293B]">{s.totalActions.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#F5F3FF]"><LogIn className="h-5 w-5 text-[#8B5CF6]" /></div>
            <div>
              <p className="text-xs text-[#64748B]">Accesos Hoy</p>
              <p className="text-xl font-bold text-[#1E293B]">{s.totalLoginAttempts}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-[#1E293B] mb-4">Actividad por Día</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={s.dailyActivity}>
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94A3B8" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#2563EB" strokeWidth={2} dot={{ fill: "#2563EB" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-[#1E293B] mb-4">Acciones por Módulo</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={s.moduleCounts.map((m) => ({ name: m.module || "General", count: m.count }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94A3B8" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2563EB" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#1E293B]">Actividad Reciente</h3>
              <button onClick={() => router.push("/auditoria/logs")} className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-medium">
                Ver Todo
              </button>
            </div>
            <div className="space-y-0">
              {s.recentActivity.slice(0, 8).map((log) => {
                const ActionIcon = actionColors[log.action] ? AlertTriangle : AlertTriangle
                return (
                  <div key={log.id} className="flex items-center gap-3 py-2 border-b border-[#E2E8F0] last:border-0">
                    <div className="w-2 h-2 rounded-full bg-[#2563EB]" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#1E293B] truncate">{log.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="default">{actionLabels[log.action] || log.action}</Badge>
                        {log.module && <span className="text-xs text-[#94A3B8]">{log.module}</span>}
                        <span className="text-xs text-[#94A3B8]">{log.user.firstName} {log.user.lastName}</span>
                      </div>
                    </div>
                    <span className="text-xs text-[#94A3B8] shrink-0">
                      {new Date(log.createdAt).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#1E293B]">Usuarios más Activos</h3>
              <button onClick={() => router.push("/auditoria/logs")} className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-medium">
                Ver Todo
              </button>
            </div>
            <div className="space-y-3">
              {s.userActivity.slice(0, 5).map((u) => (
                <div key={u.userId} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#EFF6FF] flex items-center justify-center">
                      <Users className="h-4 w-4 text-[#2563EB]" />
                    </div>
                    <span className="text-sm text-[#1E293B]">{u.name}</span>
                  </div>
                  <Badge variant="info">{u.count} acciones</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-md transition-all" onClick={() => router.push("/auditoria/logs")}>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-[#EFF6FF]"><BarChart3 className="h-5 w-5 text-[#2563EB]" /></div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-[#1E293B]">Registro de Eventos</h3>
              <p className="text-xs text-[#64748B]">Filtros avanzados, búsqueda y exportación</p>
            </div>
            <ChevronRight className="h-5 w-5 text-[#94A3B8]" />
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-all" onClick={() => router.push("/auditoria/accesos")}>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-[#FEF2F2]"><ShieldAlert className="h-5 w-5 text-[#DC2626]" /></div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-[#1E293B]">Logs de Acceso</h3>
              <p className="text-xs text-[#64748B]">Inicios de sesión exitosos y fallidos</p>
            </div>
            <ChevronRight className="h-5 w-5 text-[#94A3B8]" />
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-all" onClick={() => router.push(`${s.recentActivity[0]?.id ? `/auditoria/${s.recentActivity[0].id}` : "/auditoria/logs"}`)}>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-[#F0FDF4]"><Activity className="h-5 w-5 text-[#16A34A]" /></div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-[#1E293B]">Cambios Recientes</h3>
              <p className="text-xs text-[#64748B]">Comparación antes/después de cada modificación</p>
            </div>
            <ChevronRight className="h-5 w-5 text-[#94A3B8]" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
