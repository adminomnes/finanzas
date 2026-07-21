"use client"

import { useEffect, useState, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDateShort } from "@/lib/utils"
import {
  FileText, Download, RefreshCw, TrendingUp, TrendingDown,
  Minus, Plus,
} from "lucide-react"
import toast from "react-hot-toast"

interface IncomeStatementItem {
  label: string
  amount: number
  type: "income" | "direct_cost" | "operational_expense" | "result"
}

interface IncomeStatementData {
  period: string
  companyName: string
  items: IncomeStatementItem[]
  totalIncome: number
  totalDirectCosts: number
  totalOperationalExpenses: number
  operationalResult: number
}

export default function EstadoResultadosPage() {
  const [data, setData] = useState<IncomeStatementData | null>(null)
  const [loading, setLoading] = useState(true)
  const [startMonth, setStartMonth] = useState("")
  const [endMonth, setEndMonth] = useState("")
  const [companyId, setCompanyId] = useState("")
  const [costCenterId, setCostCenterId] = useState("")
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([])
  const [costCenters, setCostCenters] = useState<{ id: string; name: string; code: string }[]>([])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (startMonth) params.set("start", startMonth)
      if (endMonth) params.set("end", endMonth)
      if (companyId) params.set("companyId", companyId)
      if (costCenterId) params.set("costCenterId", costCenterId)

      const [res, compRes, ccRes] = await Promise.all([
        fetch(`/api/reports/income-statement?${params}`),
        fetch("/api/companies"),
        fetch("/api/cost-centers"),
      ])
      if (res.ok) setData(await res.json())
      if (compRes.ok) {
        const c = await compRes.json()
        setCompanies(c.data || c)
      }
      if (ccRes.ok) {
        const c = await ccRes.json()
        setCostCenters(c.data || c)
      }
    } catch {
      toast.error("Error al cargar estado de resultados")
    } finally {
      setLoading(false)
    }
  }, [startMonth, endMonth, companyId, costCenterId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({ format: "pdf" })
      if (startMonth) params.set("start", startMonth)
      if (endMonth) params.set("end", endMonth)
      if (companyId) params.set("companyId", companyId)

      const res = await fetch(`/api/reports/export?${params}`)
      if (!res.ok) throw new Error("Error")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `estado-resultados-${new Date().toISOString().split("T")[0]}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Estado de resultados exportado")
    } catch {
      toast.error("Error al exportar")
    }
  }

  const LineItem = ({ label, amount, type }: IncomeStatementItem) => {
    const isResult = type === "result"
    const isIncome = type === "income"
    const prefix = isResult ? "=" : isIncome ? "" : "(-)"

    return (
      <div className={`flex items-center justify-between py-2.5 ${isResult ? "border-t-2 border-[#1E293B] mt-2 pt-4" : "border-b border-[#F1F5F9]"}`}>
        <div className="flex items-center gap-3">
          {isResult ? (
            <span className="w-6 text-center font-bold text-[#1E293B]">{prefix}</span>
          ) : (
            <span className="w-6 text-center text-sm text-[#94A3B8]">{prefix}</span>
          )}
          <span className={`${isResult ? "text-base font-bold text-[#1E293B]" : "text-sm text-[#64748B]"}`}>
            {label.toUpperCase()}
          </span>
        </div>
        <span className={`font-semibold financial-number ${
          isResult
            ? amount >= 0 ? "text-[#22C55E] text-base" : "text-[#EF4444] text-base"
            : isIncome
            ? "text-[#22C55E]"
            : "text-[#EF4444]"
        }`}>
          {formatCurrency(amount)}
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#EFF6FF]">
            <FileText className="h-5 w-5 text-[#2563EB]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#1E293B]">Estado de Resultados</h2>
            <p className="text-sm text-[#64748B]">Estado financiero del período</p>
          </div>
        </div>
        {data && (
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Exportar PDF
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <div className="p-4">
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
            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1">Centro de Costo</label>
              <select
                className="px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                value={costCenterId}
                onChange={(e) => setCostCenterId(e.target.value)}
              >
                <option value="">Todos los centros</option>
                {costCenters.map((cc) => (
                  <option key={cc.id} value={cc.id}>{cc.code} - {cc.name}</option>
                ))}
              </select>
            </div>
            <Button variant="primary" size="sm" onClick={fetchData} loading={loading}>
              <RefreshCw className="h-4 w-4" />
              Generar
            </Button>
          </div>
        </div>
      </Card>

      {/* Income Statement */}
      <Card>
        {loading ? (
          <div className="p-8 space-y-4">
            <div className="skeleton h-5 w-48 mb-4" />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton h-8 w-full" />
            ))}
          </div>
        ) : !data ? (
          <div className="p-12 text-center text-sm text-[#94A3B8]">
            Seleccione un período y genere el estado de resultados
          </div>
        ) : (
          <div className="p-6">
            {/* Report Header */}
            <div className="text-center mb-6 pb-4 border-b border-[#E2E8F0]">
              <h3 className="text-base font-bold text-[#1E293B] uppercase tracking-wide">
                Estado de Resultados
              </h3>
              <p className="text-sm text-[#64748B] mt-1">
                {data.companyName || "Omnes Holding SPA"}
              </p>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Período: {data.period || `${startMonth || "Inicio"} - ${endMonth || "Actual"}`}
              </p>
            </div>

            {/* Line Items */}
            <div className="max-w-2xl mx-auto">
              {/* Income */}
              <div className="flex items-center justify-between py-2.5 border-b border-[#E2E8F0]">
                <div className="flex items-center gap-3">
                  <span className="w-6 text-center" />
                  <span className="text-sm font-medium text-[#1E293B]">INGRESOS</span>
                </div>
                <span className="text-sm font-semibold text-[#22C55E] financial-number">
                  {formatCurrency(data.totalIncome)}
                </span>
              </div>

              {/* Direct Costs */}
              <div className="flex items-center justify-between py-2.5 border-b border-[#F1F5F9]">
                <div className="flex items-center gap-3">
                  <span className="w-6 text-center text-sm text-[#94A3B8]">(-)</span>
                  <span className="text-sm text-[#64748B]">COSTOS DIRECTOS</span>
                </div>
                <span className="text-sm font-semibold text-[#EF4444] financial-number">
                  {formatCurrency(data.totalDirectCosts)}
                </span>
              </div>

              {/* Operational Expenses */}
              <div className="flex items-center justify-between py-2.5 border-b border-[#F1F5F9]">
                <div className="flex items-center gap-3">
                  <span className="w-6 text-center text-sm text-[#94A3B8]">(-)</span>
                  <span className="text-sm text-[#64748B]">GASTOS OPERACIONALES</span>
                </div>
                <span className="text-sm font-semibold text-[#EF4444] financial-number">
                  {formatCurrency(data.totalOperationalExpenses)}
                </span>
              </div>

              {/* Result */}
              <div className="flex items-center justify-between py-3 mt-3 border-t-2 border-[#1E293B]">
                <div className="flex items-center gap-3">
                  <span className="w-6 text-center font-bold text-[#1E293B]">=</span>
                  <span className="text-base font-bold text-[#1E293B]">RESULTADO OPERACIONAL</span>
                </div>
                <span className={`text-base font-bold financial-number ${
                  data.operationalResult >= 0 ? "text-[#22C55E]" : "text-[#EF4444]"
                }`}>
                  {formatCurrency(data.operationalResult)}
                </span>
              </div>
            </div>

            {/* Result Badge */}
            <div className="text-center mt-6">
              <Badge variant={data.operationalResult >= 0 ? "success" : "danger"} size="md">
                {data.operationalResult >= 0 ? (
                  <><TrendingUp className="h-3.5 w-3.5 mr-1" /> Resultado Positivo</>
                ) : (
                  <><TrendingDown className="h-3.5 w-3.5 mr-1" /> Resultado Negativo</>
                )}
              </Badge>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
