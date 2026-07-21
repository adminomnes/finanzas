"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  FileText,
  Calendar,
  Filter,
} from "lucide-react"
import toast from "react-hot-toast"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"

interface MonthlyInvoice {
  month: string
  total: number
  count: number
}

interface StatusDistribution {
  name: string
  value: number
  color: string
}

interface Invoice {
  id: string
  number: string
  date: string
  dueDate: string
  totalAmount: number
  status: string
  paymentDate?: string
  client: { id: string; name: string }
}

interface TopClient {
  clientName: string
  totalBilled: number
}

interface Stats {
  monthlyInvoices: MonthlyInvoice[]
  statusDistribution: StatusDistribution[]
  topClients: TopClient[]
}

const statusLabels: Record<string, string> = {
  EMITIDA: "Emitida",
  ENVIADA: "Enviada",
  PENDIENTE_PAGO: "Pendiente Pago",
  PAGADA: "Pagada",
  ANULADA: "Anulada",
}

const statusColors: Record<string, string> = {
  EMITIDA: "#2563EB",
  ENVIADA: "#D97706",
  PENDIENTE_PAGO: "#EF4444",
  PAGADA: "#16A34A",
  ANULADA: "#94A3B8",
}

const PIE_COLORS = ["#2563EB", "#D97706", "#EF4444", "#16A34A", "#94A3B8"]

export default function ReportesPage() {
  const router = useRouter()
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats | null>(null)
  const [pendingInvoices, setPendingInvoices] = useState<Invoice[]>([])
  const [paidInvoices, setPaidInvoices] = useState<Invoice[]>([])

  const fetchStats = async () => {
    try {
      const params = new URLSearchParams()
      if (startDate) params.set("startDate", startDate)
      if (endDate) params.set("endDate", endDate)

      const [statsRes, pendingRes, paidRes] = await Promise.all([
        fetch(`/api/income/stats?${params}`),
        fetch("/api/income/invoices?status=EMITIDA,ENVIADA,PENDIENTE_PAGO"),
        fetch("/api/income/invoices?status=PAGADA"),
      ])

      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data)
      }
      if (pendingRes.ok) {
        const data = await pendingRes.json()
        setPendingInvoices(data.data || data)
      }
      if (paidRes.ok) {
        const data = await paidRes.json()
        setPaidInvoices(data.data || data)
      }
    } catch {
      toast.error("Error al cargar reportes")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const getDaysOverdue = (dueDate: string): number => {
    const due = new Date(dueDate)
    const today = new Date()
    const diff = today.getTime() - due.getTime()
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
  }

  const handleExport = (format: string) => {
    const params = new URLSearchParams({ format })
    if (startDate) params.set("startDate", startDate)
    if (endDate) params.set("endDate", endDate)
    window.open(`/api/income/export?${params}`, "_blank")
  }

  const statusDistribution: StatusDistribution[] = stats?.statusDistribution?.length
    ? stats.statusDistribution
    : []

  const monthlyData: MonthlyInvoice[] = stats?.monthlyInvoices?.length
    ? stats.monthlyInvoices
    : []

  const topClients: TopClient[] = stats?.topClients?.length
    ? stats.topClients
    : []

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#F0FDF4]">
            <BarChart3 className="h-5 w-5 text-[#16A34A]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#1E293B]">Reportes de Ingresos</h2>
            <p className="text-sm text-[#64748B]">Análisis y reportes financieros</p>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#94A3B8]" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
              />
              <span className="text-[#94A3B8]">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
              />
              <Button variant="outline" size="sm" onClick={fetchStats}>
                <Filter className="h-4 w-4" />
                Filtrar
              </Button>
            </div>
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#64748B]">Exportar:</span>
              <Button variant="outline" size="sm" onClick={() => handleExport("xlsx")}>
                <FileSpreadsheet className="h-4 w-4" />
                Excel
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport("pdf")}>
                <FileText className="h-4 w-4" />
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport("csv")}>
                <Download className="h-4 w-4" />
                CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-[#1E293B] mb-4">Ingresos por Período</h3>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center text-[#94A3B8] text-sm">Cargando...</div>
            ) : monthlyData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-[#94A3B8] text-sm">Sin datos</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748B" }} axisLine={{ stroke: "#E2E8F0" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000000).toFixed(0)}M`} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                    formatter={(value) => [formatCurrency(Number(value)), "Total"]}
                  />
                  <Bar dataKey="total" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-[#1E293B] mb-4">Distribución por Estado</h3>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center text-[#94A3B8] text-sm">Cargando...</div>
            ) : statusDistribution.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-[#94A3B8] text-sm">Sin datos</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusDistribution.map((s) => ({
                      ...s,
                      name: statusLabels[s.name] || s.name,
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, idx) => (
                      <Cell key={entry.name} fill={statusColors[entry.name] || PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                    formatter={(value, name) => [Number(value), name]}
                  />
                  <Legend
                    verticalAlign="bottom"
                    formatter={(value) => <span className="text-sm text-[#64748B]">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold text-[#1E293B] mb-4">Facturas Pendientes</h3>
          {loading ? (
            <div className="py-8 text-center text-[#94A3B8] text-sm">Cargando...</div>
          ) : pendingInvoices.length === 0 ? (
            <div className="py-8 text-center text-[#94A3B8] text-sm">No hay facturas pendientes</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E2E8F0]">
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">N° Factura</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Cliente</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Fecha Emisión</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Vencimiento</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Total</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Días Vencido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {pendingInvoices.map((inv) => {
                    const overdue = getDaysOverdue(inv.dueDate)
                    return (
                      <tr key={inv.id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-[#1E293B]">{inv.number}</td>
                        <td className="px-4 py-3 text-sm text-[#64748B]">{inv.client.name}</td>
                        <td className="px-4 py-3 text-sm text-[#64748B]">{new Date(inv.date).toLocaleDateString("es-CL")}</td>
                        <td className="px-4 py-3 text-sm text-[#64748B]">{new Date(inv.dueDate).toLocaleDateString("es-CL")}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-right text-[#1E293B]">{formatCurrency(inv.totalAmount)}</td>
                        <td className="px-4 py-3 text-center">
                          {overdue > 0 ? (
                            <Badge variant="danger">{overdue} días</Badge>
                          ) : (
                            <span className="text-sm text-[#94A3B8]">-</span>
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

      <Card>
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold text-[#1E293B] mb-4">Facturas Pagadas</h3>
          {loading ? (
            <div className="py-8 text-center text-[#94A3B8] text-sm">Cargando...</div>
          ) : paidInvoices.length === 0 ? (
            <div className="py-8 text-center text-[#94A3B8] text-sm">No hay facturas pagadas</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E2E8F0]">
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">N° Factura</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Cliente</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Total</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Fecha Pago</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {paidInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-[#1E293B]">{inv.number}</td>
                      <td className="px-4 py-3 text-sm text-[#64748B]">{inv.client.name}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-right text-[#1E293B]">{formatCurrency(inv.totalAmount)}</td>
                      <td className="px-4 py-3 text-sm text-[#64748B]">
                        {inv.paymentDate ? new Date(inv.paymentDate).toLocaleDateString("es-CL") : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold text-[#1E293B] mb-4">Top Clientes</h3>
          {loading ? (
            <div className="py-8 text-center text-[#94A3B8] text-sm">Cargando...</div>
          ) : topClients.length === 0 ? (
            <div className="py-8 text-center text-[#94A3B8] text-sm">Sin datos de clientes</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E2E8F0]">
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Cliente</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Total Facturado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {topClients.map((client, idx) => (
                    <tr key={idx} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-4 py-3 text-sm text-[#1E293B]">{client.clientName}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-right text-[#1E293B]">{formatCurrency(client.totalBilled)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
