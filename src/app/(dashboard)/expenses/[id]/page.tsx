"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/utils"
import { ArrowLeft, ArrowDownCircle } from "lucide-react"
import toast from "react-hot-toast"

interface ExpenseDetail {
  id: string
  date: string
  description: string
  netAmount: number
  taxAmount: number
  totalAmount: number
  documentType: string
  documentNumber: string | null
  status: string
  paymentMethod: string
  notes: string | null
  createdAt: string
  updatedAt: string
  company: { id: string; name: string; rut: string }
  supplier: { id: string; name: string; rut: string }
  category: { id: string; name: string; color: string }
  costCenter: { id: string; name: string; code: string }
  responsible: { id: string; firstName: string; lastName: string; email: string }
  createdBy: { id: string; firstName: string; lastName: string }
  attachments: { id: string; fileName: string; url: string }[]
}

const statusLabels: Record<string, string> = {
  PENDING: "Pendiente",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
  CANCELLED: "Anulado",
}

const statusVariants: Record<string, "warning" | "success" | "danger" | "default"> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  CANCELLED: "default",
}

export default function ExpenseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [expense, setExpense] = useState<ExpenseDetail | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchExpense = async () => {
    try {
      const res = await fetch(`/api/expenses/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setExpense(data.data)
      }
    } catch {
      toast.error("Error al cargar gasto")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExpense()
  }, [params.id])

  const changeStatus = async (status: string) => {
    try {
      const res = await fetch(`/api/expenses/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        toast.success("Estado actualizado")
        fetchExpense()
      }
    } catch {
      toast.error("Error al actualizar")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[#64748B]">Cargando...</p>
      </div>
    )
  }

  if (!expense) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[#64748B]">Gasto no encontrado</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg text-[#64748B] hover:bg-[#F1F5F9] transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-3 flex-1">
          <div className="p-2 rounded-lg bg-[#FEF2F2]">
            <ArrowDownCircle className="h-5 w-5 text-[#EF4444]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#1E293B]">Detalle del Gasto</h2>
            <p className="text-sm text-[#64748B]">{expense.description}</p>
          </div>
        </div>
        <Badge variant={statusVariants[expense.status]}>
          {statusLabels[expense.status]}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-[#1E293B] mb-4">
              Información General
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-[#64748B]">Fecha</span>
                <span className="text-sm font-medium text-[#1E293B]">
                  {formatDate(expense.date)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#64748B]">Empresa</span>
                <span className="text-sm font-medium text-[#1E293B]">
                  {expense.company.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#64748B]">Proveedor</span>
                <span className="text-sm font-medium text-[#1E293B]">
                  {expense.supplier.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#64748B]">RUT Proveedor</span>
                <span className="text-sm font-medium text-[#1E293B]">
                  {expense.supplier.rut}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#64748B]">Tipo Documento</span>
                <span className="text-sm font-medium text-[#1E293B]">
                  {expense.documentType}
                </span>
              </div>
              {expense.documentNumber && (
                <div className="flex justify-between">
                  <span className="text-sm text-[#64748B]">N° Documento</span>
                  <span className="text-sm font-medium text-[#1E293B]">
                    {expense.documentNumber}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-[#1E293B] mb-4">
              Clasificación
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-[#64748B]">Categoría</span>
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: expense.category.color }}
                  />
                  <span className="text-sm font-medium text-[#1E293B]">
                    {expense.category.name}
                  </span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#64748B]">Centro de Costo</span>
                <span className="text-sm font-medium text-[#1E293B]">
                  {expense.costCenter.code} - {expense.costCenter.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#64748B]">Método de Pago</span>
                <span className="text-sm font-medium text-[#1E293B]">
                  {expense.paymentMethod}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#64748B]">Responsable</span>
                <span className="text-sm font-medium text-[#1E293B]">
                  {expense.responsible.firstName} {expense.responsible.lastName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#64748B]">Creado por</span>
                <span className="text-sm font-medium text-[#1E293B]">
                  {expense.createdBy.firstName} {expense.createdBy.lastName}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold text-[#1E293B] mb-4">
            Montos
          </h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg bg-[#F8FAFC]">
              <p className="text-xs text-[#64748B] mb-1">Neto</p>
              <p className="text-lg font-semibold text-[#1E293B]">
                {formatCurrency(expense.netAmount)}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-[#F8FAFC]">
              <p className="text-xs text-[#64748B] mb-1">IVA</p>
              <p className="text-lg font-semibold text-[#1E293B]">
                {formatCurrency(expense.taxAmount)}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-[#FEF2F2]">
              <p className="text-xs text-[#EF4444] mb-1">Total</p>
              <p className="text-lg font-semibold text-[#EF4444]">
                {formatCurrency(expense.totalAmount)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {expense.notes && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-[#1E293B] mb-2">Notas</h3>
            <p className="text-sm text-[#64748B]">{expense.notes}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold text-[#1E293B] mb-4">
            Cambiar Estado
          </h3>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={expense.status === "PENDING" ? "primary" : "outline"}
              size="sm"
              onClick={() => changeStatus("PENDING")}
            >
              Pendiente
            </Button>
            <Button
              variant={expense.status === "APPROVED" ? "primary" : "outline"}
              size="sm"
              onClick={() => changeStatus("APPROVED")}
            >
              Aprobar
            </Button>
            <Button
              variant={expense.status === "REJECTED" ? "danger" : "outline"}
              size="sm"
              onClick={() => changeStatus("REJECTED")}
            >
              Rechazar
            </Button>
            <Button
              variant={expense.status === "CANCELLED" ? "outline" : "ghost"}
              size="sm"
              onClick={() => changeStatus("CANCELLED")}
            >
              Anular
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
