"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDateShort } from "@/lib/utils"
import {
  BarChart3, TrendingUp, TrendingDown, DollarSign, Activity,
  Download, FileSpreadsheet, FileText, FileJson, RefreshCw,
  ArrowUpRight, ArrowDownRight, Clock, Users, Target,
  ChevronRight, Calendar,
} from "lucide-react"
import toast from "react-hot-toast"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"

interface MonthlyData {
  month: string
  income: number
  expenses: number
}

interface RecentActivity {
  date: string
  user: string
  action: string
  description: string
}

interface FinancialData {
  totalIncome: number
  totalExpenses: number
  netResult: number
  previousMonthIncome: number
  incomeVariation: number
  pendingInvoices: number
  monthlyCashFlow: MonthlyData[]
  recentActivity: RecentActivity[]
}

export default function ReportsPage() {
  const [data, setData] = useState<FinancialData | null>(null)
  const [loading, setLoading] = useState(true)
  const [startMonth, setStartMonth] = useState("")
  const [endMonth, setEndMonth] = useState("")
  const [companyId, setCompanyId] = useState("")
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([])
  const [exporting, setExporting] = useState("")

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (startMonth) params.set("start", startMonth)
      if (endMonth) params.set("end", endMonth)
      if (companyId) params.set("companyId", companyId)

      const [finRes, compRes] = await Promise.all([
        fetch(`/api/reports/financial?${params}`),
        fetch("/api/companies"),
      ])
      if (finRes.ok) setData(await finRes.json())
      if (compRes.ok) {
        const compData = await compRes.json()
        setCompanies(compData.data || compData)
      }
    } catch {
      toast.error("Error al cargar datos financieros")
    } finally {
      setLoading(false)
    }
  }, [startMonth, endMonth, companyId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleExport = async (format: string) => {
    setExporting(format)
    try {
      const params = new URLSearchParams({ format })
      if (startMonth) params.set("start", startMonth)
      if (endMonth) params.set("end", endMonth)
      if (companyId) params.set("companyId", companyId)

      const res = await fetch(`/api/reports/export?${params}`)
      if (!res.ok) throw new Error("Error al exportar")

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `reporte-financiero.${format === "xlsx" ? "xlsx" : format === "pdf" ? "pdf" : "csv"}`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Reporte exportado exitosamente")
    } catch {
      toast.error("Error al exportar reporte")
    } finally {
      setExporting("")
    }
  }

  const trendArrow = data
    ? data.incomeVariation >= 0
      ? { icon: ArrowUpRight, color: "text-[#22C55E]", bg: "bg-[#F0FDF4]" }
      : { icon: ArrowDownRight, color: "text-[#EF4444]", bg: "bg-[#FEF2F2]" }
    : null

  const TrendIcon = trendArrow?.icon || ArrowUpRight

  if (loading && !data) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#F0FDF4]">
            <BarChart3 className="h-5 w-5 text-[#16A34A]" />
          </div>
          <div>
            <div className="skeleton h-6 w-48 mb-1" />
            <div className="skeleton h-4 w-36" />
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-[#E2E8F0] p-5">
              <div className="skeleton h-4 w-24 mb-3" />
              <div className="skeleton h-8 w-32 mb-3" />
              <div className="skeleton h-3 w-20" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#F0FDF4]">
            <BarChart3 className="h-5 w-5 text-[#16A34A]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#1E293B]">Reportes Financieros</h2>
            <p className="text-sm text-[#64748B]">Análisis financiero ejecutivo</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" loading={exporting === "xlsx"} onClick={() => handleExport("xlsx")}>
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </Button>
          <Button variant="outline" size="sm" loading={exporting === "pdf"} onClick={() => handleExport("pdf")}>
            <FileText className="h-4 w-4" />
            PDF
          </Button>
          <Button variant="outline" size="sm" loading={exporting === "csv"} onClick={() => handleExport("csv")}>
            <FileJson className="h-4 w-4" />
            CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1">Desde</label>
              <input
                type="month"
                className="px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                value={startMonth}
                onChange={(e) => setStartMonth(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1">Hasta</label>
              <input
                type="month"
                className="px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                value={endMonth}
                onChange={(e) => setEndMonth(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1">Empresa</label>
              <select
                className="px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
              >
                <option value="">Todas las empresas</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <Button variant="primary" size="sm" onClick={fetchData} loading={loading}>
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {data && (
        <>
          {/* KPI Cards */}
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 hover-card animate-fade-in-d-1">
              <div className="flex items-center justify-between mb-3">
                <span className="kpi-label">Ingresos Totales</span>
                <div className="p-2.5 rounded-xl bg-[#F0FDF4]">
                  <TrendingUp className="h-4 w-4 text-[#22C55E]" />
                </div>
              </div>
              <p className="kpi-value text-[#111827]">{formatCurrency(data.totalIncome)}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <ArrowUpRight className="h-3.5 w-3.5 text-[#22C55E]" />
                <span className="text-xs font-medium text-[#22C55E]">Ingresos del período</span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 hover-card animate-fade-in-d-2">
              <div className="flex items-center justify-between mb-3">
                <span className="kpi-label">Gastos Totales</span>
                <div className="p-2.5 rounded-xl bg-[#FEF2F2]">
                  <TrendingDown className="h-4 w-4 text-[#EF4444]" />
                </div>
              </div>
              <p className="kpi-value text-[#111827]">{formatCurrency(data.totalExpenses)}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <ArrowDownRight className="h-3.5 w-3.5 text-[#EF4444]" />
                <span className="text-xs font-medium text-[#EF4444]">Gastos del período</span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 hover-card animate-fade-in-d-3">
              <div className="flex items-center justify-between mb-3">
                <span className="kpi-label">Resultado Operacional</span>
                <div className={`p-2.5 rounded-xl ${data.netResult >= 0 ? "bg-[#EFF6FF]" : "bg-[#FEF2F2]"}`}>
                  <DollarSign className={`h-4 w-4 ${data.netResult >= 0 ? "text-[#2563EB]" : "text-[#EF4444]"}`} />
                </div>
              </div>
              <p className={`kpi-value ${data.netResult >= 0 ? "text-[#22C55E]" : "text-[#EF4444]"}`}>
                {formatCurrency(data.netResult)}
              </p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className={`text-xs font-medium ${data.netResult >= 0 ? "text-[#22C55E]" : "text-[#EF4444]"}`}>
                  {data.netResult >= 0 ? "Superávit" : "Déficit"}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 hover-card animate-fade-in-d-4">
              <div className="flex items-center justify-between mb-3">
                <span className="kpi-label">Variación vs Mes Anterior</span>
                <div className={`p-2.5 rounded-xl ${trendArrow?.bg}`}>
                  <TrendIcon className={`h-4 w-4 ${trendArrow?.color}`} />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <p className={`kpi-value ${trendArrow?.color}`}>
                  {data.incomeVariation >= 0 ? "+" : ""}{data.incomeVariation.toFixed(1)}%
                </p>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <TrendIcon className={`h-3.5 w-3.5 ${trendArrow?.color}`} />
                <span className={`text-xs font-medium ${trendArrow?.color}`}>
                  {data.incomeVariation >= 0 ? "Incremento" : "Disminución"} vs mes anterior
                </span>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid gap-5 md:grid-cols-2">
            <Card>
              <div className="p-5 pb-0">
                <h3 className="text-sm font-semibold text-[#111827]">Flujo de Caja</h3>
                <p className="text-xs text-[#64748B] mt-0.5">Ingresos vs Gastos por período</p>
              </div>
              <div className="p-5">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.monthlyCashFlow} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94A3B8", fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94A3B8", fontSize: 12 }} tickFormatter={(v: number) => v >= 1000000 ? `$${(v / 1000000).toFixed(0)}M` : v >= 1000 ? `$${(v / 1000).toFixed(0)}K` : `$${v}`} />
                    <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: "8px", fontSize: "13px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }} formatter={(value) => [formatCurrency(Number(value))]} />
                    <Bar dataKey="income" fill="#22C55E" radius={[4, 4, 0, 0]} name="Ingresos" maxBarSize={32} />
                    <Bar dataKey="expenses" fill="#EF4444" radius={[4, 4, 0, 0]} name="Gastos" maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <div className="p-5 pb-0">
                <h3 className="text-sm font-semibold text-[#111827]">Resumen Ejecutivo</h3>
                <p className="text-xs text-[#64748B] mt-0.5">Indicadores clave del período</p>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-[#F0FDF4] border border-[#DCFCE7]">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white">
                      <DollarSign className="h-5 w-5 text-[#22C55E]" />
                    </div>
                    <div>
                      <p className="text-sm text-[#64748B]">Saldo</p>
                      <p className="text-sm font-semibold text-[#111827] financial-number">
                        {formatCurrency(data.netResult)}
                      </p>
                    </div>
                  </div>
                  <Badge variant={data.netResult >= 0 ? "success" : "danger"}>
                    {data.netResult >= 0 ? "Positivo" : "Negativo"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-[#FFFBEB] border border-[#FEF3C7]">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white">
                      <Clock className="h-5 w-5 text-[#F59E0B]" />
                    </div>
                    <div>
                      <p className="text-sm text-[#64748B]">Cuentas Pendientes</p>
                      <p className="text-sm font-semibold text-[#111827]">{data.pendingInvoices} facturas</p>
                    </div>
                  </div>
                  <Badge variant="warning">Pendiente</Badge>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-[#EFF6FF] border border-[#DBEAFE]">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white">
                      <Target className="h-5 w-5 text-[#2563EB]" />
                    </div>
                    <div>
                      <p className="text-sm text-[#64748B]">Proyección</p>
                      <p className="text-sm font-semibold text-[#111827] financial-number">
                        {formatCurrency(
                          data.monthlyCashFlow.length >= 2
                            ? data.monthlyCashFlow[data.monthlyCashFlow.length - 1].income * (1 + data.incomeVariation / 100)
                            : data.netResult
                        )}
                      </p>
                    </div>
                  </div>
                  <Badge variant="info">Estimado</Badge>
                </div>
              </div>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <div className="p-5 pb-0">
              <h3 className="text-sm font-semibold text-[#111827]">Actividad Reciente</h3>
              <p className="text-xs text-[#64748B] mt-0.5">Últimas acciones en el sistema</p>
            </div>
            <div className="p-5">
              <div className="space-y-1">
                {data.recentActivity.length === 0 ? (
                  <div className="text-center py-8 text-sm text-[#94A3B8]">
                    Sin actividad reciente
                  </div>
                ) : (
                  data.recentActivity.map((act, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#F8FAFC] transition-colors">
                      <div className="mt-0.5">
                        <div className="w-2 h-2 rounded-full bg-[#2563EB]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-[#1E293B]">{act.user}</span>
                          <span className="text-xs text-[#94A3B8]">{act.action}</span>
                        </div>
                        <p className="text-sm text-[#64748B] truncate">{act.description}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-[#94A3B8]">{formatDateShort(act.date)}</span>
                        <ChevronRight className="h-4 w-4 text-[#CBD5E1]" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
