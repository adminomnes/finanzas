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
  Filter,
  ArrowDownCircle,
} from "lucide-react"
import toast from "react-hot-toast"

interface Expense {
  id: string
  date: string
  description: string
  netAmount: number
  taxAmount: number
  totalAmount: number
  documentType: string
  documentNumber: string | null
  status: string
  company: { id: string; name: string }
  supplier: { id: string; name: string }
  category: { id: string; name: string; color: string }
  costCenter: { id: string; name: string; code: string }
  responsible: { id: string; firstName: string; lastName: string }
}

const statusVariant: Record<string, "warning" | "success" | "danger" | "default"> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  CANCELLED: "default",
}

const statusLabels: Record<string, string> = {
  PENDING: "Pendiente",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
  CANCELLED: "Anulado",
}

export default function ExpensesPage() {
  const router = useRouter()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchExpenses = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: "20" })
      if (search) params.set("search", search)
      if (statusFilter) params.set("status", statusFilter)

      const res = await fetch(`/api/expenses?${params}`)
      if (res.ok) {
        const data = await res.json()
        setExpenses(data.data)
        setTotalPages(data.totalPages)
      }
    } catch {
      toast.error("Error al cargar gastos")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExpenses()
  }, [page, statusFilter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchExpenses()
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#FEF2F2]">
            <ArrowDownCircle className="h-5 w-5 text-[#EF4444]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#1E293B]">Gastos</h2>
            <p className="text-sm text-[#64748B]">
              Gestión de gastos y documentos
            </p>
          </div>
        </div>
        <Button onClick={() => router.push("/expenses/new")}>
          <Plus className="h-4 w-4" />
          Nuevo Gasto
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <form onSubmit={handleSearch} className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Buscar gastos..."
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
              <option value="APPROVED">Aprobado</option>
              <option value="REJECTED">Rechazado</option>
              <option value="CANCELLED">Anulado</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-[#94A3B8]">
              Cargando gastos...
            </div>
          ) : expenses.length === 0 ? (
            <div className="p-12 text-center">
              <ArrowDownCircle className="h-12 w-12 text-[#E2E8F0] mx-auto mb-3" />
              <p className="text-[#64748B]">No hay gastos registrados</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push("/expenses/new")}
              >
                <Plus className="h-4 w-4" />
                Crear primer gasto
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
                      Proveedor
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">
                      Categoría
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">
                      Centro Costo
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
                  {expenses.map((expense) => (
                    <tr
                      key={expense.id}
                      className="hover:bg-[#F8FAFC] transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-[#64748B]">
                        {formatDateShort(expense.date)}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-[#1E293B] max-w-[200px] truncate">
                        {expense.description}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#64748B]">
                        {expense.supplier.name}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: expense.category.color }}
                          />
                          <span className="text-sm text-[#64748B]">
                            {expense.category.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#64748B]">
                        {expense.costCenter.code}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-right text-[#1E293B]">
                        {formatCurrency(expense.totalAmount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={statusVariant[expense.status]}>
                          {statusLabels[expense.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => router.push(`/expenses/${expense.id}`)}
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
