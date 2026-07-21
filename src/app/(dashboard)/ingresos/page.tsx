"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDateShort } from "@/lib/utils"
import {
  ArrowUpCircle, DollarSign, Clock, AlertTriangle, Users,
  BarChart3, Download, TrendingUp, TrendingDown, Plus, FileText,
  CheckCircle,
} from "lucide-react"
import toast from "react-hot-toast"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts"

interface Stats {
  totalInvoicedMonth: number
  totalInvoicedYear: number
  pendingInvoices: number
  overdueInvoices: number
  totalPendingAmount: number
  totalOverdueAmount: number
  totalCollectedMonth: number
  totalCollectedYear: number
  clientsWithDebt: number
  monthlyInvoices: { month: string; count: number; totalAmount: number }[]
  topClients: { client: { id: string; name: string; rut: string }; totalInvoiced: number }[]
  recentActivity: {
    id: string
    previousStatus: string | null
    newStatus: string
    comment: string | null
    createdAt: string
    changedBy: { firstName: string; lastName: string }
    invoice: { number: string }
  }[]
}

const statusLabels: Record<string, string> = {
  BORRADOR: "Borrador", EMITIDA: "Emitida", ENVIADA: "Enviada",
  PENDIENTE_PAGO: "Pendiente Pago", PAGADA: "Pagada", VENCIDA: "Vencida", ANULADA: "Anulada",
}

export default function IngresosDashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/income/stats")
        if (res.ok) {
          const data = await res.json()
          setStats(data.data)
        }
      } catch {
        toast.error("Error al cargar estadísticas")
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-[#16A34A] to-[#15803D]">
            <ArrowUpCircle className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#1E293B]">Panel de Ingresos</h2>
            <p className="text-sm text-[#64748B]">Resumen de facturación y cobranza</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => router.push("/ingresos/facturas/nueva")}>
            <Plus className="h-4 w-4" />
            Nueva Factura
          </Button>
          <Button variant="outline" onClick={() => window.open("/api/income/export?format=xlsx", "_blank")}>
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-5"><div className="animate-pulse space-y-3"><div className="h-4 bg-[#F1F5F9] rounded w-24" /><div className="h-8 bg-[#F1F5F9] rounded w-32" /></div></CardContent></Card>
          ))
        ) : (
          <>
            <Card className="hover-card">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-[#64748B] uppercase tracking-wider">Facturado del Mes</span>
                  <div className="p-1.5 rounded-lg bg-[#F0FDF4]">
                    <DollarSign className="h-4 w-4 text-[#16A34A]" />
                  </div>
                </div>
                <p className="kpi-value">{formatCurrency(stats?.totalInvoicedMonth || 0)}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-[#16A34A]" />
                  <span className="text-xs text-[#16A34A]">{(stats && stats.totalInvoicedYear > 0) ? `${((stats.totalInvoicedMonth / stats.totalInvoicedYear) * 100).toFixed(1)}% del año` : "Sin datos"}</span>
                </div>
              </CardContent>
            </Card>
            <Card className="hover-card">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-[#64748B] uppercase tracking-wider">Pendientes</span>
                  <div className="p-1.5 rounded-lg bg-[#FFFBEB]">
                    <Clock className="h-4 w-4 text-[#D97706]" />
                  </div>
                </div>
                <p className="kpi-value">{stats?.pendingInvoices || 0}</p>
                <p className="kpi-label">{formatCurrency(stats?.totalPendingAmount || 0)} por cobrar</p>
              </CardContent>
            </Card>
            <Card className="hover-card">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-[#64748B] uppercase tracking-wider">Vencidas</span>
                  <div className="p-1.5 rounded-lg bg-[#FEF2F2]">
                    <AlertTriangle className="h-4 w-4 text-[#DC2626]" />
                  </div>
                </div>
                <p className="kpi-value">{stats?.overdueInvoices || 0}</p>
                <p className="kpi-label">{formatCurrency(stats?.totalOverdueAmount || 0)} en mora</p>
              </CardContent>
            </Card>
            <Card className="hover-card">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-[#64748B] uppercase tracking-wider">Cobrado del Mes</span>
                  <div className="p-1.5 rounded-lg bg-[#EFF6FF]">
                    <TrendingDown className="h-4 w-4 text-[#2563EB]" />
                  </div>
                </div>
                <p className="kpi-value">{formatCurrency(stats?.totalCollectedMonth || 0)}</p>
                <p className="kpi-label">{formatCurrency(stats?.totalCollectedYear || 0)} en el año</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-2">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-[#1E293B] mb-4">Ingresos Mensuales</h3>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center text-[#94A3B8]">Cargando...</div>
            ) : !stats?.monthlyInvoices?.length ? (
              <div className="h-[300px] flex items-center justify-center text-[#94A3B8]">Sin datos</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.monthlyInvoices}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748B" }} axisLine={{ stroke: "#E2E8F0" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000000).toFixed(0)}M`} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} formatter={(value) => [formatCurrency(Number(value)), "Total"]} />
                  <Bar dataKey="totalAmount" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-[#1E293B] mb-4">Cobranza</h3>
            {loading ? (
              <div className="space-y-3 animate-pulse"><div className="h-10 bg-[#F1F5F9] rounded" /><div className="h-10 bg-[#F1F5F9] rounded" /><div className="h-10 bg-[#F1F5F9] rounded" /><div className="h-10 bg-[#F1F5F9] rounded" /></div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#FFFBEB]">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#D97706]" />
                    <span className="text-sm text-[#1E293B]">Facturas Pendientes</span>
                  </div>
                  <span className="text-sm font-bold text-[#D97706]">{stats?.pendingInvoices || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#FEF2F2]">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-[#DC2626]" />
                    <span className="text-sm text-[#1E293B]">Facturas Vencidas</span>
                  </div>
                  <span className="text-sm font-bold text-[#DC2626]">{stats?.overdueInvoices || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#F0FDF4]">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-[#16A34A]" />
                    <span className="text-sm text-[#1E293B]">Monto por Cobrar</span>
                  </div>
                  <span className="text-sm font-bold text-[#16A34A]">{formatCurrency(stats?.totalPendingAmount || 0)}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#EFF6FF]">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#2563EB]" />
                    <span className="text-sm text-[#1E293B]">Clientes con Deuda</span>
                  </div>
                  <span className="text-sm font-bold text-[#2563EB]">{stats?.clientsWithDebt || 0}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-[#1E293B] mb-4">Top Clientes</h3>
            {loading ? (
              <div className="space-y-2 animate-pulse"><div className="h-8 bg-[#F1F5F9] rounded" /><div className="h-8 bg-[#F1F5F9] rounded" /><div className="h-8 bg-[#F1F5F9] rounded" /></div>
            ) : !stats?.topClients?.length ? (
              <div className="py-8 text-center text-[#94A3B8] text-sm">Sin datos</div>
            ) : (
              <div className="divide-y divide-[#E2E8F0]">
                {stats.topClients.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#F1F5F9] flex items-center justify-center text-xs font-medium text-[#64748B]">{i + 1}</div>
                      <span className="text-sm text-[#1E293B]">{item.client.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-[#1E293B]">{formatCurrency(item.totalInvoiced)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-[#1E293B] mb-4">Actividad Reciente</h3>
            {loading ? (
              <div className="space-y-3 animate-pulse"><div className="h-10 bg-[#F1F5F9] rounded" /><div className="h-10 bg-[#F1F5F9] rounded" /><div className="h-10 bg-[#F1F5F9] rounded" /></div>
            ) : !stats?.recentActivity?.length ? (
              <div className="py-8 text-center text-[#94A3B8] text-sm">Sin actividad reciente</div>
            ) : (
              <div className="space-y-3">
                {stats.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-[#F1F5F9] last:border-0">
                    <div className="w-2 h-2 rounded-full bg-[#2563EB] mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-[#1E293B]">{activity.changedBy.firstName} {activity.changedBy.lastName}</span>
                        <span className="text-[10px] text-[#94A3B8]">{formatDateShort(activity.createdAt)}</span>
                      </div>
                      <p className="text-xs text-[#64748B] mt-0.5">
                        Factura <span className="font-medium">{activity.invoice.number}</span>
                        {activity.previousStatus ? (
                          <>: <Badge variant="default">{statusLabels[activity.previousStatus]}</Badge> → <Badge variant="success">{statusLabels[activity.newStatus]}</Badge></>
                        ) : (
                          <>: <Badge variant="success">{statusLabels[activity.newStatus]}</Badge></>
                        )}
                      </p>
                      {activity.comment && <p className="text-xs text-[#94A3B8] mt-0.5 italic">"{activity.comment}"</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
