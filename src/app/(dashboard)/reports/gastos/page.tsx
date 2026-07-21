"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDateShort } from "@/lib/utils"
import {
  TrendingDown, Filter, Search, RefreshCw, AlertTriangle,
} from "lucide-react"
import toast from "react-hot-toast"
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts"

type GroupBy = "Categoría" | "Empresa" | "Proveedor" | "Responsable" | "Período"

interface ExpenseGroup {
  name: string
  total: number
  count: number
}

interface TopExpense {
  id: string
  code: string
  date: string
  description: string
  supplier: string
  totalAmount: number
  status: string
}

interface StatusDistribution {
  name: string
  value: number
}

interface ExpenseReportData {
  totalExpenses: number
  expenseCount: number
  groups: ExpenseGroup[]
  statusDistribution: StatusDistribution[]
  topExpenses: TopExpense[]
}

const statusVariant: Record<string, "warning" | "success" | "danger" | "info" | "default"> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  PAGADO: "info",
  CANCELLED: "default",
}

const statusLabels: Record<string, string> = {
  PENDING: "Pendiente",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
  PAGADO: "Pagado",
  CANCELLED: "Anulado",
}

const pieColors: Record<string, string> = {
  PENDING: "#F59E0B",
  APPROVED: "#22C55E",
  REJECTED: "#EF4444",
  PAGADO: "#2563EB",
  CANCELLED: "#94A3B8",
}

const groupByOptions: GroupBy[] = ["Categoría", "Empresa", "Proveedor", "Responsable", "Período"]

export default function GastosReportPage() {
  const [data, setData] = useState<ExpenseReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [companyId, setCompanyId] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [groupBy, setGroupBy] = useState<GroupBy>("Categoría")
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([])
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ groupBy: groupBy.toLowerCase() })
      if (startDate) params.set("start", startDate)
      if (endDate) params.set("end", endDate)
      if (companyId) params.set("companyId", companyId)
      if (categoryId) params.set("categoryId", categoryId)

      const [res, compRes, catRes] = await Promise.all([
        fetch(`/api/reports/expenses?${params}`),
        fetch("/api/companies"),
        fetch("/api/categories"),
      ])
      if (res.ok) setData(await res.json())
      if (compRes.ok) {
        const c = await compRes.json()
        setCompanies(c.data || c)
      }
      if (catRes.ok) {
        const c = await catRes.json()
        setCategories(c.data || c)
      }
    } catch {
      toast.error("Error al cargar análisis de gastos")
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate, companyId, categoryId, groupBy])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-[#FEF2F2]">
          <TrendingDown className="h-5 w-5 text-[#EF4444]" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[#1E293B]">Análisis de Gastos</h2>
          <p className="text-sm text-[#64748B]">Gastos por categoría, empresa y proveedor</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1">Desde</label>
              <input
                type="date"
                className="px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1">Hasta</label>
              <input
                type="date"
                className="px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1">Empresa</label>
              <select
                className="px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
              >
                <option value="">Todas</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1">Categoría</label>
              <select
                className="px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">Todas</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1">Agrupar por</label>
              <select
                className="px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as GroupBy)}
              >
                {groupByOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
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

      {loading && !data ? (
        <div className="grid gap-5 md:grid-cols-2">
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
            <div className="skeleton h-5 w-40 mb-4" />
            <div className="skeleton h-[280px] w-full" />
          </div>
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
            <div className="skeleton h-5 w-40 mb-4" />
            <div className="skeleton h-[280px] w-full" />
          </div>
        </div>
      ) : data ? (
        <>
          {/* Summary */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
            <div className="flex items-center justify-between">
              <div>
                <span className="kpi-label">Total Gastos</span>
                <p className="kpi-value text-[#EF4444] mt-1">{formatCurrency(data.totalExpenses)}</p>
              </div>
              <div className="text-right">
                <span className="kpi-label">Cantidad</span>
                <p className="kpi-value text-[#111827] mt-1">{data.expenseCount} gastos</p>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid gap-5 md:grid-cols-2">
            {/* Bar Chart by group */}
            <Card>
              <div className="p-5 pb-0">
                <h3 className="text-sm font-semibold text-[#111827]">Gastos por {groupBy}</h3>
                <p className="text-xs text-[#64748B] mt-0.5">Distribución agrupada</p>
              </div>
              <div className="p-5">
                {data.groups.length === 0 ? (
                  <div className="h-[280px] flex items-center justify-center text-sm text-[#94A3B8]">
                    Sin datos
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={data.groups} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94A3B8", fontSize: 11 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94A3B8", fontSize: 12 }} tickFormatter={(v: number) => v >= 1000000 ? `$${(v / 1000000).toFixed(0)}M` : v >= 1000 ? `$${(v / 1000).toFixed(0)}K` : `$${v}`} />
                      <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: "8px", fontSize: "13px" }} formatter={(value) => [formatCurrency(Number(value))]} />
                      <Bar dataKey="total" fill="#EF4444" radius={[4, 4, 0, 0]} name="Total" maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            {/* Pie Chart by status */}
            <Card>
              <div className="p-5 pb-0">
                <h3 className="text-sm font-semibold text-[#111827]">Distribución por Estado</h3>
                <p className="text-xs text-[#64748B] mt-0.5">Cantidad de gastos por estado</p>
              </div>
              <div className="p-5">
                {data.statusDistribution.length === 0 ? (
                  <div className="h-[280px] flex items-center justify-center text-sm text-[#94A3B8]">
                    Sin datos
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={data.statusDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="value"
                        nameKey="name"
                      >
                        {data.statusDistribution.map((entry) => (
                          <Cell key={entry.name} fill={pieColors[entry.name] || "#94A3B8"} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: "8px", fontSize: "13px" }} />
                      <Legend
                        formatter={(value: string) => (
                          <span className="text-xs text-[#64748B]">{statusLabels[value] || value}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          </div>

          {/* Top 10 Table */}
          <Card>
            <div className="p-5 pb-3">
              <h3 className="text-sm font-semibold text-[#111827]">Top 10 Mayores Gastos</h3>
              <p className="text-xs text-[#64748B] mt-0.5">Los gastos más altos del período</p>
            </div>
            <div className="overflow-x-auto">
              {data.topExpenses.length === 0 ? (
                <div className="p-8 text-center text-sm text-[#94A3B8]">
                  No hay gastos registrados en el período
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                      <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Código</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Fecha</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Descripción</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Proveedor</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Total</th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {data.topExpenses.map((exp, i) => (
                      <tr key={exp.id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="px-4 py-3 text-sm font-mono text-[#64748B]">{exp.code}</td>
                        <td className="px-4 py-3 text-sm text-[#64748B]">{formatDateShort(exp.date)}</td>
                        <td className="px-4 py-3 text-sm font-medium text-[#1E293B] max-w-[200px] truncate">
                          {exp.description}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#64748B]">{exp.supplier}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-right text-[#EF4444] financial-number">
                          {formatCurrency(exp.totalAmount)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={statusVariant[exp.status] || "default"}>
                            {statusLabels[exp.status] || exp.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        </>
      ) : null}
    </div>
  )
}
