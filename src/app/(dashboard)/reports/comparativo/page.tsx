"use client"

import { useEffect, useState, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import {
  BarChart3, TrendingUp, TrendingDown, DollarSign,
  ArrowUpRight, ArrowDownRight, RefreshCw,
} from "lucide-react"
import toast from "react-hot-toast"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts"

interface MonthData {
  month: string
  income: number
  expenses: number
  result: number
}

interface MonthlyComparison {
  currentMonth: { income: number; expenses: number; result: number }
  previousMonth: { income: number; expenses: number; result: number }
  incomeVariation: number
  expensesVariation: number
  resultVariation: number
  monthlyData: MonthData[]
}

const monthsOptions = [
  { value: "3", label: "3 meses" },
  { value: "6", label: "6 meses" },
  { value: "12", label: "12 meses" },
]

function VariationBadge({ value, label }: { value: number; label: string }) {
  const isPositive = value >= 0
  const color = isPositive ? "text-[#22C55E]" : "text-[#EF4444]"
  const bg = isPositive ? "bg-[#F0FDF4]" : "bg-[#FEF2F2]"
  const Icon = isPositive ? ArrowUpRight : ArrowDownRight

  return (
    <div className="flex items-center gap-1.5">
      <div className={`p-1 rounded-md ${bg}`}>
        <Icon className={`h-3 w-3 ${color}`} />
      </div>
      <span className={`text-xs font-semibold ${color}`}>
        {isPositive ? "+" : ""}{value.toFixed(1)}%
      </span>
    </div>
  )
}

export default function ComparativoPage() {
  const [data, setData] = useState<MonthlyComparison | null>(null)
  const [loading, setLoading] = useState(true)
  const [months, setMonths] = useState("6")

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reports/comparative?months=${months}`)
      if (res.ok) setData(await res.json())
    } catch {
      toast.error("Error al cargar datos comparativos")
    } finally {
      setLoading(false)
    }
  }, [months])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading && !data) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#EFF6FF]">
            <BarChart3 className="h-5 w-5 text-[#2563EB]" />
          </div>
          <div>
            <div className="skeleton h-6 w-48 mb-1" />
            <div className="skeleton h-4 w-36" />
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
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
          <div className="p-2.5 rounded-xl bg-[#EFF6FF]">
            <BarChart3 className="h-5 w-5 text-[#2563EB]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#1E293B]">Comparativo Mensual</h2>
            <p className="text-sm text-[#64748B]">Mes actual vs meses anteriores</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-[#F1F5F9] rounded-lg p-1">
            {monthsOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setMonths(opt.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  months === opt.value
                    ? "bg-white text-[#1E293B] shadow-sm"
                    : "text-[#64748B] hover:text-[#1E293B]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} loading={loading}>
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </Button>
        </div>
      </div>

      {data && (
        <>
          {/* KPI Variation Cards */}
          <div className="grid gap-5 md:grid-cols-3">
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 hover-card">
              <div className="flex items-center justify-between mb-3">
                <span className="kpi-label">Ingresos</span>
                <div className="p-2.5 rounded-xl bg-[#F0FDF4]">
                  <TrendingUp className="h-4 w-4 text-[#22C55E]" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="kpi-value text-[#111827]">{formatCurrency(data.currentMonth.income)}</p>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-[#64748B]">
                  vs {formatCurrency(data.previousMonth.income)} mes anterior
                </span>
                <VariationBadge value={data.incomeVariation} label="Ingresos" />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 hover-card">
              <div className="flex items-center justify-between mb-3">
                <span className="kpi-label">Gastos</span>
                <div className="p-2.5 rounded-xl bg-[#FEF2F2]">
                  <TrendingDown className="h-4 w-4 text-[#EF4444]" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="kpi-value text-[#111827]">{formatCurrency(data.currentMonth.expenses)}</p>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-[#64748B]">
                  vs {formatCurrency(data.previousMonth.expenses)} mes anterior
                </span>
                <VariationBadge value={data.expensesVariation} label="Gastos" />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 hover-card">
              <div className="flex items-center justify-between mb-3">
                <span className="kpi-label">Resultado</span>
                <div className={`p-2.5 rounded-xl ${data.currentMonth.result >= 0 ? "bg-[#EFF6FF]" : "bg-[#FEF2F2]"}`}>
                  <DollarSign className={`h-4 w-4 ${data.currentMonth.result >= 0 ? "text-[#2563EB]" : "text-[#EF4444]"}`} />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <p className={`kpi-value ${data.currentMonth.result >= 0 ? "text-[#22C55E]" : "text-[#EF4444]"}`}>
                  {formatCurrency(data.currentMonth.result)}
                </p>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-[#64748B]">
                  vs {formatCurrency(data.previousMonth.result)} mes anterior
                </span>
                <VariationBadge value={data.resultVariation} label="Resultado" />
              </div>
            </div>
          </div>

          {/* Main Chart */}
          <Card>
            <div className="p-5 pb-0">
              <h3 className="text-sm font-semibold text-[#111827]">Evolución Mensual</h3>
              <p className="text-xs text-[#64748B] mt-0.5">Ingresos, Gastos y Resultado por mes</p>
            </div>
            <div className="p-5">
              {data.monthlyData.length === 0 ? (
                <div className="h-[320px] flex items-center justify-center text-sm text-[#94A3B8]">
                  Sin datos disponibles
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={data.monthlyData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94A3B8", fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94A3B8", fontSize: 12 }} tickFormatter={(v: number) => v >= 1000000 ? `$${(v / 1000000).toFixed(0)}M` : v >= 1000 ? `$${(v / 1000).toFixed(0)}K` : `$${v}`} />
                    <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: "8px", fontSize: "13px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }} formatter={(value) => [formatCurrency(Number(value))]} />
                    <Legend formatter={(value: string) => <span className="text-xs text-[#64748B]">{value}</span>} />
                    <Bar dataKey="income" fill="#22C55E" radius={[4, 4, 0, 0]} name="Ingresos" maxBarSize={24} />
                    <Bar dataKey="expenses" fill="#EF4444" radius={[4, 4, 0, 0]} name="Gastos" maxBarSize={24} />
                    <Bar dataKey="result" fill="#2563EB" radius={[4, 4, 0, 0]} name="Resultado" maxBarSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          {/* Comparison Table */}
          <Card>
            <div className="p-5 pb-3">
              <h3 className="text-sm font-semibold text-[#111827]">Comparativo Detallado</h3>
              <p className="text-xs text-[#64748B] mt-0.5">{months} meses de análisis</p>
            </div>
            <div className="overflow-x-auto">
              {data.monthlyData.length === 0 ? (
                <div className="p-8 text-center text-sm text-[#94A3B8]">
                  No hay datos para el período seleccionado
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                      <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Mes</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Ingresos</th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Variación</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Gastos</th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Variación</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Resultado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {data.monthlyData.map((m, i) => {
                      const prev = i > 0 ? data.monthlyData[i - 1] : null
                      const incomeVar = prev ? ((m.income - prev.income) / prev.income * 100) : 0
                      const expenseVar = prev ? ((m.expenses - prev.expenses) / prev.expenses * 100) : 0

                      return (
                        <tr key={i} className="hover:bg-[#F8FAFC] transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-[#1E293B]">{m.month}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-right text-[#22C55E] financial-number">
                            {formatCurrency(m.income)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {prev ? (
                              <span className={`text-xs font-semibold ${incomeVar >= 0 ? "text-[#22C55E]" : "text-[#EF4444]"}`}>
                                {incomeVar >= 0 ? "+" : ""}{incomeVar.toFixed(1)}%
                              </span>
                            ) : (
                              <span className="text-xs text-[#94A3B8]">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-right text-[#EF4444] financial-number">
                            {formatCurrency(m.expenses)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {prev ? (
                              <span className={`text-xs font-semibold ${expenseVar <= 0 ? "text-[#22C55E]" : "text-[#EF4444]"}`}>
                                {expenseVar >= 0 ? "+" : ""}{expenseVar.toFixed(1)}%
                              </span>
                            ) : (
                              <span className="text-xs text-[#94A3B8]">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`text-sm font-bold financial-number ${m.result >= 0 ? "text-[#22C55E]" : "text-[#EF4444]"}`}>
                              {formatCurrency(m.result)}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
