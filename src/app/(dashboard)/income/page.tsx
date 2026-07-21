"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDateShort } from "@/lib/utils"
import {
  Plus,
  Search,
  Eye,
  ArrowUpCircle,
} from "lucide-react"
import toast from "react-hot-toast"

interface Income {
  id: string
  date: string
  description: string
  netAmount: number
  taxAmount: number
  totalAmount: number
  status: string
  paymentMethod: string
  company: { id: string; name: string }
  category: { id: string; name: string; color: string }
}

const statusVariant: Record<string, "warning" | "success" | "default"> = {
  PENDING: "warning",
  RECEIVED: "success",
  CANCELLED: "default",
}

const statusLabels: Record<string, string> = {
  PENDING: "Pendiente",
  RECEIVED: "Recibido",
  CANCELLED: "Anulado",
}

export default function IncomePage() {
  const router = useRouter()
  const [incomes, setIncomes] = useState<Income[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchIncomes = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: "20" })
      if (search) params.set("search", search)
      if (statusFilter) params.set("status", statusFilter)

      const res = await fetch(`/api/income?${params}`)
      if (res.ok) {
        const data = await res.json()
        setIncomes(data.data)
        setTotalPages(data.totalPages)
      }
    } catch {
      toast.error("Error al cargar ingresos")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchIncomes()
  }, [page, statusFilter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchIncomes()
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#F0FDF4]">
            <ArrowUpCircle className="h-5 w-5 text-[#16A34A]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#1E293B]">Ingresos</h2>
            <p className="text-sm text-[#64748B]">
              Gestión de ingresos y facturación
            </p>
          </div>
        </div>
        <Button onClick={() => router.push("/income/new")}>
          <Plus className="h-4 w-4" />
          Nuevo Ingreso
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <form onSubmit={handleSearch} className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Buscar ingresos..."
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </form>
            <select
              className="px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
            >
              <option value="">Todos los estados</option>
              <option value="PENDING">Pendiente</option>
              <option value="RECEIVED">Recibido</option>
              <option value="CANCELLED">Anulado</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-[#94A3B8]">
              Cargando ingresos...
            </div>
          ) : incomes.length === 0 ? (
            <div className="p-12 text-center">
              <ArrowUpCircle className="h-12 w-12 text-[#E2E8F0] mx-auto mb-3" />
              <p className="text-[#64748B]">No hay ingresos registrados</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push("/income/new")}
              >
                <Plus className="h-4 w-4" />
                Crear primer ingreso
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E2E8F0]">
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">
                      Descripción
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">
                      Categoría
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">
                      Empresa
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">
                      Total
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {incomes.map((income) => (
                    <tr
                      key={income.id}
                      className="hover:bg-[#F8FAFC] transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-[#64748B]">
                        {formatDateShort(income.date)}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-[#1E293B] max-w-[200px] truncate">
                        {income.description}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: income.category.color }}
                          />
                          <span className="text-sm text-[#64748B]">
                            {income.category.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#64748B]">
                        {income.company.name}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-right text-[#1E293B]">
                        {formatCurrency(income.totalAmount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={statusVariant[income.status]}>
                          {statusLabels[income.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => router.push(`/income/${income.id}`)}
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
