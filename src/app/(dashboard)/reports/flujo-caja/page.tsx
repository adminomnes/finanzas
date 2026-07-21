"use client"

import { useEffect, useState, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDateShort } from "@/lib/utils"
import {
  ArrowUpCircle, ArrowDownCircle, DollarSign, TrendingUp, TrendingDown,
  Calendar,
} from "lucide-react"
import toast from "react-hot-toast"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"

interface CashFlowItem {
  period: string
  income: number
  expenses: number
  balance: number
}

type PeriodTab = "DIARIO" | "SEMANAL" | "MENSUAL"

const periodTabs: { key: PeriodTab; label: string }[] = [
  { key: "DIARIO", label: "Diario" },
  { key: "SEMANAL", label: "Semanal" },
  { key: "MENSUAL", label: "Mensual" },
]

export default function FlujoCajaPage() {
  const [data, setData] = useState<CashFlowItem[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<PeriodTab>("MENSUAL")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ period: period.toLowerCase() })
      if (startDate) params.set("start", startDate)
      if (endDate) params.set("end", endDate)

      const res = await fetch(`/api/reports/financial?${params}`)
      if (res.ok) {
        const json = await res.json()
        const rawData = json.data?.monthlyCashFlow || []
        const formattedData = rawData.map((item: any) => ({
          ...item,
          period: item.period || item.month || "",
        }))
        setData(formattedData)
      }
    } catch {
      toast.error("Error al cargar flujo de caja")
    } finally {
      setLoading(false)
    }
  }, [period, startDate, endDate])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const totals = data.reduce(
    (acc, item) => ({
      income: acc.income + item.income,
      expenses: acc.expenses + item.expenses,
      balance: acc.balance + item.balance,
    }),
    { income: 0, expenses: 0, balance: 0 }
  )

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-[#F0FDF4]">
          <ArrowUpCircle className="h-5 w-5 text-[#16A34A]" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[#1E293B]">Flujo de Caja</h2>
          <p className="text-sm text-[#64748B]">Entradas y salidas de efectivo</p>
        </div>
      </div>

      {/* Period Tabs + Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex bg-[#F1F5F9] rounded-lg p-1">
          {periodTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setPeriod(tab.key)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                period === tab.key
                  ? "bg-white text-[#1E293B] shadow-sm"
                  : "text-[#64748B] hover:text-[#1E293B]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <span className="text-sm text-[#94A3B8]">a</span>
          <input
            type="date"
            className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <Button variant="outline" size="sm" onClick={fetchData}>
            <Calendar className="h-4 w-4" />
            Filtrar
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-5 md:grid-cols-3">
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 hover-card">
          <div className="flex items-center justify-between mb-3">
            <span className="kpi-label">Total Entradas</span>
            <div className="p-2.5 rounded-xl bg-[#F0FDF4]">
              <TrendingUp className="h-4 w-4 text-[#22C55E]" />
            </div>
          </div>
          <p className="kpi-value text-[#22C55E]">{formatCurrency(totals.income)}</p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-xs text-[#64748B]">{data.length} períodos</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 hover-card">
          <div className="flex items-center justify-between mb-3">
            <span className="kpi-label">Total Salidas</span>
            <div className="p-2.5 rounded-xl bg-[#FEF2F2]">
              <TrendingDown className="h-4 w-4 text-[#EF4444]" />
            </div>
          </div>
          <p className="kpi-value text-[#EF4444]">{formatCurrency(totals.expenses)}</p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-xs text-[#64748B]">{data.length} períodos</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 hover-card">
          <div className="flex items-center justify-between mb-3">
            <span className="kpi-label">Saldo Neto</span>
            <div className={`p-2.5 rounded-xl ${totals.balance >= 0 ? "bg-[#EFF6FF]" : "bg-[#FEF2F2]"}`}>
              <DollarSign className={`h-4 w-4 ${totals.balance >= 0 ? "text-[#2563EB]" : "text-[#EF4444]"}`} />
            </div>
          </div>
          <p className={`kpi-value ${totals.balance >= 0 ? "text-[#2563EB]" : "text-[#EF4444]"}`}>
            {formatCurrency(totals.balance)}
          </p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className={`text-xs font-medium ${totals.balance >= 0 ? "text-[#22C55E]" : "text-[#EF4444]"}`}>
              {totals.balance >= 0 ? "Flujo positivo" : "Flujo negativo"}
            </span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <Card>
        <div className="p-5 pb-0">
          <h3 className="text-sm font-semibold text-[#111827]">Evolución del Flujo de Caja</h3>
          <p className="text-xs text-[#64748B] mt-0.5">Ingresos y Gastos por {period.toLowerCase()}</p>
        </div>
        <div className="p-5">
          {loading ? (
            <div className="h-[320px] flex items-center justify-center">
              <div className="skeleton h-full w-full rounded-lg" />
            </div>
          ) : data.length === 0 ? (
            <div className="h-[320px] flex items-center justify-center text-sm text-[#94A3B8]">
              Sin datos para el período seleccionado
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fill: "#94A3B8", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94A3B8", fontSize: 12 }} tickFormatter={(v: number) => v >= 1000000 ? `$${(v / 1000000).toFixed(0)}M` : v >= 1000 ? `$${(v / 1000).toFixed(0)}K` : `$${v}`} />
                <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: "8px", fontSize: "13px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }} formatter={(value) => [formatCurrency(Number(value))]} />
                <Bar dataKey="income" fill="#22C55E" radius={[4, 4, 0, 0]} name="Ingresos" maxBarSize={40} />
                <Bar dataKey="expenses" fill="#EF4444" radius={[4, 4, 0, 0]} name="Gastos" maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      {/* Detail Table */}
      <Card>
        <div className="p-5 pb-3">
          <h3 className="text-sm font-semibold text-[#111827]">Detalle por {period.toLowerCase()}</h3>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="skeleton h-6 w-full" />
              ))}
            </div>
          ) : data.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#94A3B8]">
              No hay datos disponibles
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Período</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Ingresos</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Gastos</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {data.map((item, i) => (
                  <tr key={i} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-[#1E293B]">{item.period}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-right text-[#22C55E] financial-number">
                      {formatCurrency(item.income)}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-right text-[#EF4444] financial-number">
                      {formatCurrency(item.expenses)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-sm font-semibold financial-number ${item.balance >= 0 ? "text-[#2563EB]" : "text-[#EF4444]"}`}>
                        {formatCurrency(item.balance)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[#E2E8F0] bg-[#F8FAFC]">
                  <td className="px-4 py-3 text-sm font-bold text-[#1E293B]">Totales</td>
                  <td className="px-4 py-3 text-sm font-bold text-right text-[#22C55E] financial-number">
                    {formatCurrency(totals.income)}
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-right text-[#EF4444] financial-number">
                    {formatCurrency(totals.expenses)}
                  </td>
                  <td className={`px-4 py-3 text-sm font-bold text-right financial-number ${totals.balance >= 0 ? "text-[#2563EB]" : "text-[#EF4444]"}`}>
                    {formatCurrency(totals.balance)}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </Card>
    </div>
  )
}
