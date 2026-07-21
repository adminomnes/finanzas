"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { formatCurrency, formatDateShort } from "@/lib/utils"
import {
  Plus,
  Search,
  Eye,
  FileText,
  Download,
  Filter,
} from "lucide-react"
import toast from "react-hot-toast"

interface Invoice {
  id: string
  number: string
  issueDate: string
  dueDate: string | null
  netAmount: number
  taxAmount: number
  totalAmount: number
  currency: string
  status: string
  client: { id: string; name: string; rut: string }
  company: { id: string; name: string }
}

interface InvoiceStats {
  totalInvoicedMonth: number
  pendingInvoices: number
  overdueInvoices: number
  totalCollectedMonth: number
}

const statusVariant: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
  BORRADOR: "default",
  EMITIDA: "info",
  ENVIADA: "warning",
  PENDIENTE_PAGO: "warning",
  PAGADA: "success",
  VENCIDA: "danger",
  ANULADA: "default",
}

const statusLabels: Record<string, string> = {
  BORRADOR: "Borrador",
  EMITIDA: "Emitida",
  ENVIADA: "Enviada",
  PENDIENTE_PAGO: "Pendiente Pago",
  PAGADA: "Pagada",
  VENCIDA: "Vencida",
  ANULADA: "Anulada",
}

const ALL_STATUSES = ["BORRADOR", "EMITIDA", "ENVIADA", "PENDIENTE_PAGO", "PAGADA", "VENCIDA", "ANULADA"]

export default function FacturasPage() {
  const router = useRouter()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [stats, setStats] = useState<InvoiceStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [clientFilter, setClientFilter] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [amountMin, setAmountMin] = useState("")
  const [amountMax, setAmountMax] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchInvoices = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: "20" })
      if (search) params.set("search", search)
      if (statusFilter) params.set("status", statusFilter)
      if (clientFilter) params.set("client", clientFilter)
      if (dateFrom) params.set("dateFrom", dateFrom)
      if (dateTo) params.set("dateTo", dateTo)
      if (amountMin) params.set("amountMin", amountMin)
      if (amountMax) params.set("amountMax", amountMax)

      const res = await fetch(`/api/income/invoices?${params}`)
      if (res.ok) {
        const data = await res.json()
        setInvoices(data.data)
        setTotalPages(data.totalPages)
      }
    } catch {
      toast.error("Error al cargar facturas")
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/income/stats")
      if (res.ok) {
        const data = await res.json()
        setStats(data.data)
      }
    } catch {
      // silent
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  useEffect(() => {
    fetchInvoices()
  }, [page, statusFilter, clientFilter, dateFrom, dateTo, amountMin, amountMax])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchInvoices()
  }

  const handleExport = (format: string) => {
    const params = new URLSearchParams({ format })
    if (statusFilter) params.set("status", statusFilter)
    if (dateFrom) params.set("dateFrom", dateFrom)
    if (dateTo) params.set("dateTo", dateTo)
    window.open(`/api/income/export?${params}`, "_blank")
  }

  const clearFilters = () => {
    setSearch("")
    setStatusFilter("")
    setClientFilter("")
    setDateFrom("")
    setDateTo("")
    setAmountMin("")
    setAmountMax("")
    setPage(1)
  }

  const hasActiveFilters = search || statusFilter || clientFilter || dateFrom || dateTo || amountMin || amountMax

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#EFF6FF]">
            <FileText className="h-5 w-5 text-[#2563EB]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#1E293B]">Facturas</h2>
            <p className="text-sm text-[#64748B]">
              Gestión de facturación empresarial
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport("xlsx")}>
            <Download className="h-4 w-4" />
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport("pdf")}>
            <Download className="h-4 w-4" />
            PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport("csv")}>
            <Download className="h-4 w-4" />
            CSV
          </Button>
          <Button onClick={() => router.push("/ingresos/facturas/nueva")}>
            <Plus className="h-4 w-4" />
            Nueva Factura
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#64748B] mb-1">Total del Mes</p>
            <p className="text-lg font-semibold text-[#1E293B]">
              {stats ? formatCurrency(stats.totalInvoicedMonth) : "-"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#64748B] mb-1">Pendientes</p>
            <p className="text-lg font-semibold text-[#D97706]">
              {stats ? stats.pendingInvoices : "-"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#64748B] mb-1">Vencidas</p>
            <p className="text-lg font-semibold text-[#DC2626]">
              {stats ? stats.overdueInvoices : "-"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[#64748B] mb-1">Pagadas</p>
            <p className="text-lg font-semibold text-[#16A34A]">
              {stats ? formatCurrency(stats.totalCollectedMonth) : "-"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <form onSubmit={handleSearch} className="flex-1 relative min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="N° Factura / Descripción..."
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </form>
            <select
              className="px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            >
              <option value="">Todos los estados</option>
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>{statusLabels[s]}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Cliente..."
              className="w-40 px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
              value={clientFilter}
              onChange={(e) => { setClientFilter(e.target.value); setPage(1) }}
            />
            <input
              type="date"
              className="w-36 px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
              title="Fecha desde"
            />
            <input
              type="date"
              className="w-36 px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
              title="Fecha hasta"
            />
            <input
              type="number"
              placeholder="Monto min."
              className="w-32 px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
              value={amountMin}
              onChange={(e) => { setAmountMin(e.target.value); setPage(1) }}
            />
            <input
              type="number"
              placeholder="Monto max."
              className="w-32 px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
              value={amountMax}
              onChange={(e) => { setAmountMax(e.target.value); setPage(1) }}
            />
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-[#2563EB] hover:underline whitespace-nowrap"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-[#94A3B8]">
              Cargando facturas...
            </div>
          ) : invoices.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-6 w-6" />}
              title="No hay facturas registradas"
              description="Cree su primera factura para comenzar a gestionar su facturación"
              action={
                <Button onClick={() => router.push("/ingresos/facturas/nueva")}>
                  <Plus className="h-4 w-4" />
                  Crear primera factura
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E2E8F0]">
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">N° Factura</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Fecha Emisión</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Cliente</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Total</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Estado</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {invoices.map((inv) => (
                    <tr
                      key={inv.id}
                      className="hover-card hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                      onClick={() => router.push(`/ingresos/facturas/${inv.id}`)}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-[#1E293B]">
                        {inv.number}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#64748B]">
                        {formatDateShort(inv.issueDate)}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#64748B]">
                        {inv.client.name}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-right text-[#1E293B]">
                        <span className="financial-number">{formatCurrency(inv.totalAmount)}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={statusVariant[inv.status]}>
                          {statusLabels[inv.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); router.push(`/ingresos/facturas/${inv.id}`) }}
                          className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#2563EB] hover:bg-[#EFF6FF] transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#E2E8F0]">
              <span className="text-sm text-[#64748B]">
                Página {page} de {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
