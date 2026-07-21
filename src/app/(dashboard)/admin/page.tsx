"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShieldCheck, Users, Shield, Settings, Activity, UserCog, ChevronRight, Clock, AlertTriangle } from "lucide-react"
import { formatDate } from "@/lib/utils"

interface AuditEntry {
  id: string
  action: string
  description: string
  createdAt: string
  user: { firstName: string; lastName: string }
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState({ users: 0, logs: 0 })
  const [recentLogs, setRecentLogs] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, auditRes] = await Promise.all([
          fetch("/api/users"),
          fetch("/api/audit?limit=5"),
        ])
        if (userRes.ok) {
          const d = await userRes.json()
          setStats((s) => ({ ...s, users: d.data.length }))
        }
        if (auditRes.ok) {
          const d = await auditRes.json()
          setRecentLogs(d.data)
          setStats((s) => ({ ...s, logs: d.total }))
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const quickActions = [
    { label: "Gestión de Usuarios", desc: "Crear, editar y gestionar usuarios del sistema", icon: Users, href: "/admin/users", color: "text-[#2563EB]", bg: "bg-[#EFF6FF]" },
    { label: "Roles y Permisos", desc: "Configurar permisos y roles de acceso", icon: Shield, href: "/admin/roles", color: "text-[#8B5CF6]", bg: "bg-[#F5F3FF]" },
    { label: "Configuración General", desc: "Parámetros del sistema y preferencias", icon: Settings, href: "/admin/settings", color: "text-[#14B8A6]", bg: "bg-[#F0FDF4]" },
    { label: "Seguridad y Actividad", desc: "Monitorear eventos de seguridad", icon: Activity, href: "/admin/security", color: "text-[#EF4444]", bg: "bg-[#FEF2F2]" },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-[#F0FDF4]">
          <ShieldCheck className="h-5 w-5 text-[#16A34A]" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[#1E293B]">Panel de Administración</h2>
          <p className="text-sm text-[#64748B]">Centro de control del sistema</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#EFF6FF]">
              <Users className="h-5 w-5 text-[#2563EB]" />
            </div>
            <div>
              <p className="text-xs text-[#64748B]">Total Usuarios</p>
              <p className="text-xl font-bold text-[#1E293B]">{loading ? "..." : stats.users}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#F5F3FF]">
              <Shield className="h-5 w-5 text-[#8B5CF6]" />
            </div>
            <div>
              <p className="text-xs text-[#64748B]">Eventos Auditoría</p>
              <p className="text-xl font-bold text-[#1E293B]">{loading ? "..." : stats.logs}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#F0FDF4]">
              <UserCog className="h-5 w-5 text-[#14B8A6]" />
            </div>
            <div>
              <p className="text-xs text-[#64748B]">Roles Activos</p>
              <p className="text-xl font-bold text-[#1E293B]">3</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#FFFBEB]">
              <Clock className="h-5 w-5 text-[#F59E0B]" />
            </div>
            <div>
              <p className="text-xs text-[#64748B]">Pendientes</p>
              <p className="text-xl font-bold text-[#1E293B]">0</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {quickActions.map((action) => {
          const Icon = action.icon
          return (
            <Card key={action.href} className="cursor-pointer hover:shadow-md transition-all duration-200"
              onClick={() => router.push(action.href)}>
              <CardContent className="p-5 flex items-start gap-4">
                <div className={`p-2 rounded-lg ${action.bg}`}>
                  <Icon className={`h-5 w-5 ${action.color}`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-[#1E293B]">{action.label}</h3>
                  <p className="text-xs text-[#64748B] mt-1">{action.desc}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-[#94A3B8] mt-1" />
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-[#1E293B]">Actividad Reciente</h3>
              <p className="text-xs text-[#94A3B8]">Últimos eventos del sistema</p>
            </div>
            <button onClick={() => router.push("/admin/security")}
              className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-medium">
              Ver todo
            </button>
          </div>
          {loading ? (
            <div className="text-center py-4 text-sm text-[#94A3B8]">Cargando...</div>
          ) : recentLogs.length === 0 ? (
            <div className="text-center py-4 text-sm text-[#94A3B8]">Sin actividad reciente</div>
          ) : (
            <div className="space-y-3">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-[#F8FAFC] transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <AlertTriangle className="h-3.5 w-3.5 text-[#94A3B8] flex-shrink-0" />
                    <p className="text-sm text-[#1E293B] truncate">{log.description}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-[#94A3B8]">{log.user.firstName} {log.user.lastName}</span>
                    <Badge variant="default">{formatDate(log.createdAt)}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
