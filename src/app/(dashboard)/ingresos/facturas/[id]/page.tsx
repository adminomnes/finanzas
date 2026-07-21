"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { EmptyState } from "@/components/ui/empty-state"
import { formatCurrency, formatDate } from "@/lib/utils"
import { ArrowLeft, FileText, Eye } from "lucide-react"
import toast from "react-hot-toast"

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitValue: number
  discount: number
  total: number
}

interface Payment {
  id: string
  date: string
  amount: number
  method: string
  bank: string | null
  account: string | null
  reference: string | null
  notes: string | null
  createdBy: { id: string; firstName: string; lastName: string }
}

interface StatusHistory {
  id: string
  previousStatus: string | null
  newStatus: string
  comment: string | null
  createdAt: string
  changedBy: { id: string; firstName: string; lastName: string }
}

interface InvoiceDetail {
  id: string
  number: string
  issueDate: string
  dueDate: string | null
  status: string
  description: string | null
  netAmount: number
  taxAmount: number
  totalAmount: number
  currency: string
  notes: string | null
  pdfUrl: string | null
  xmlUrl: string | null
  createdAt: string
  client: { id: string; name: string; rut: string }
  company: { id: string; name: string }
  createdBy: { id: string; firstName: string; lastName: string }
  items: InvoiceItem[]
  payments: Payment[]
  statusHistory: StatusHistory[]
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

export default function FacturaDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelComment, setCancelComment] = useState("")

  const fetchInvoice = async () => {
    try {
      const res = await fetch(`/api/income/invoices/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setInvoice(data.data)
      }
    } catch {
      toast.error("Error al cargar factura")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoice()
  }, [params.id])

  const changeStatus = async (status: string, comment?: string) => {
    setUpdating(true)
    try {
      const body: Record<string, unknown> = { status }
      if (comment) body.comment = comment

      const res = await fetch(`/api/income/invoices/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        toast.success("Estado actualizado")
        setShowCancelModal(false)
        setCancelComment("")
        fetchInvoice()
      } else {
        const data = await res.json()
        toast.error(data.error || "Error al actualizar")
      }
    } catch {
      toast.error("Error de conexión")
    } finally {
      setUpdating(false)
    }
  }

  const handleCancel = () => {
    changeStatus("ANULADA", cancelComment)
  }

  const renderActions = () => {
    if (!invoice) return null
    const status = invoice.status

    return (
      <div className="flex items-center gap-2">
        {status === "BORRADOR" && (
          <>
            <Button size="sm" loading={updating} onClick={() => changeStatus("EMITIDA")}>
              Emitir
            </Button>
            <Button size="sm" variant="outline" onClick={() => router.push(`/ingresos/facturas/${invoice.id}/editar`)}>
              Editar
            </Button>
          </>
        )}
        {status === "EMITIDA" && (
          <Button size="sm" loading={updating} onClick={() => changeStatus("ENVIADA")}>
            Enviar
          </Button>
        )}
        {status === "ENVIADA" && (
          <Button size="sm" loading={updating} onClick={() => changeStatus("PENDIENTE_PAGO")}>
            Marcar Pendiente Pago
          </Button>
        )}
        {status === "PENDIENTE_PAGO" && (
          <Button size="sm" onClick={() => router.push(`/ingresos/pagos?invoiceId=${invoice.id}`)}>
            Registrar Pago
          </Button>
        )}
        {["EMITIDA", "ENVIADA", "PENDIENTE_PAGO"].includes(status) && (
          <Button size="sm" variant="ghost" onClick={() => setShowCancelModal(true)}>
            Anular
          </Button>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[#64748B]">Cargando...</p>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[#64748B]">Factura no encontrada</p>
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
          <div className="p-2 rounded-lg bg-[#EFF6FF]">
            <FileText className="h-5 w-5 text-[#2563EB]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#1E293B]">Factura {invoice.number}</h2>
            <p className="text-sm text-[#64748B]">{invoice.description || "Sin descripción"}</p>
          </div>
        </div>
        <Badge variant={statusVariant[invoice.status]}>
          {statusLabels[invoice.status]}
        </Badge>
        {renderActions()}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-[#1E293B] mb-4">Información General</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-[#64748B]">N° Factura</span>
                <span className="text-sm font-medium text-[#1E293B]">{invoice.number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#64748B]">Fecha Emisión</span>
                <span className="text-sm font-medium text-[#1E293B]">{formatDate(invoice.issueDate)}</span>
              </div>
              {invoice.dueDate && (
                <div className="flex justify-between">
                  <span className="text-sm text-[#64748B]">Fecha Vencimiento</span>
                  <span className="text-sm font-medium text-[#1E293B]">{formatDate(invoice.dueDate)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-[#64748B]">Cliente</span>
                <span className="text-sm font-medium text-[#1E293B]">{invoice.client.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#64748B]">RUT Cliente</span>
                <span className="text-sm font-medium text-[#1E293B]">{invoice.client.rut}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#64748B]">Empresa</span>
                <span className="text-sm font-medium text-[#1E293B]">{invoice.company.name}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-[#1E293B] mb-4">Resumen Financiero</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-[#64748B]">Neto</span>
                <span className="text-sm font-semibold text-[#1E293B]">
                  <span className="financial-number">{formatCurrency(invoice.netAmount)}</span>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#64748B]">IVA (19%)</span>
                <span className="text-sm font-semibold text-[#1E293B]">
                  <span className="financial-number">{formatCurrency(invoice.taxAmount)}</span>
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#E2E8F0]">
                <span className="text-sm font-semibold text-[#1E293B]">Total</span>
                <span className="text-base font-bold text-[#2563EB]">
                  <span className="financial-number">{formatCurrency(invoice.totalAmount)}</span>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#64748B]">Moneda</span>
                <span className="text-sm font-medium text-[#1E293B]">{invoice.currency}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold text-[#1E293B] mb-4">Detalle de Factura</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E2E8F0]">
                  <th className="text-left px-3 py-2 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Descripción</th>
                  <th className="text-center px-3 py-2 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Cantidad</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Valor Unitario</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Descuento</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {invoice.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-2 text-sm text-[#1E293B]">{item.description}</td>
                    <td className="px-3 py-2 text-sm text-center text-[#64748B]">{item.quantity}</td>
                    <td className="px-3 py-2 text-sm text-right text-[#64748B]">
                      <span className="financial-number">{formatCurrency(item.unitValue)}</span>
                    </td>
                    <td className="px-3 py-2 text-sm text-right text-[#64748B]">{item.discount > 0 ? `${item.discount}%` : "-"}</td>
                    <td className="px-3 py-2 text-sm font-semibold text-right text-[#1E293B]">
                      <span className="financial-number">{formatCurrency(item.total)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold text-[#1E293B] mb-4">Pagos Recibidos</h3>
          {invoice.payments.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-6 w-6" />}
              title="Sin pagos registrados"
              description="No se han registrado pagos para esta factura"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E2E8F0]">
                    <th className="text-left px-3 py-2 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Fecha</th>
                    <th className="text-right px-3 py-2 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Monto</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Método</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Banco</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Referencia</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Responsable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {invoice.payments.map((p) => (
                    <tr key={p.id}>
                      <td className="px-3 py-2 text-sm text-[#64748B]">{formatDate(p.date)}</td>
                      <td className="px-3 py-2 text-sm font-semibold text-right text-[#1E293B]">
                        <span className="financial-number">{formatCurrency(p.amount)}</span>
                      </td>
                      <td className="px-3 py-2 text-sm text-[#64748B]">{p.method}</td>
                      <td className="px-3 py-2 text-sm text-[#64748B]">{p.bank || "-"}</td>
                      <td className="px-3 py-2 text-sm text-[#64748B]">{p.reference || "-"}</td>
                      <td className="px-3 py-2 text-sm text-[#64748B]">{p.createdBy.firstName} {p.createdBy.lastName}</td>
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
          <h3 className="text-sm font-semibold text-[#1E293B] mb-4">Historial de Cambios</h3>
          {invoice.statusHistory.length === 0 ? (
            <p className="text-sm text-[#64748B]">Sin cambios registrados</p>
          ) : (
            <div className="relative">
              <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-[#E2E8F0]" />
              <div className="space-y-5">
                {invoice.statusHistory.map((h) => (
                  <div key={h.id} className="relative pl-8">
                    <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-[#F1F5F9] border-2 border-white flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-[#2563EB]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-[#1E293B]">
                          {h.changedBy.firstName} {h.changedBy.lastName}
                        </span>
                        <span className="text-[#94A3B8]">·</span>
                        <span className="text-[#94A3B8] text-xs">{formatDate(h.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {h.previousStatus && (
                          <>
                            <Badge variant={statusVariant[h.previousStatus]} size="sm">
                              {statusLabels[h.previousStatus]}
                            </Badge>
                            <span className="text-[#94A3B8] text-xs">→</span>
                          </>
                        )}
                        <Badge variant={statusVariant[h.newStatus]} size="sm">
                          {statusLabels[h.newStatus]}
                        </Badge>
                      </div>
                      {h.comment && (
                        <p className="text-sm text-[#64748B] mt-1">{h.comment}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {invoice.notes && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-[#1E293B] mb-2">Notas</h3>
            <p className="text-sm text-[#64748B]">{invoice.notes}</p>
          </CardContent>
        </Card>
      )}

      <Modal
        open={showCancelModal}
        onClose={() => { setShowCancelModal(false); setCancelComment("") }}
        title="Anular Factura"
        subtitle="¿Está seguro de que desea anular esta factura?"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Motivo de anulación</label>
            <textarea
              className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] resize-none"
              rows={3}
              value={cancelComment}
              onChange={(e) => setCancelComment(e.target.value)}
              placeholder="Opcional: indique el motivo"
            />
          </div>
          <div className="flex gap-3">
            <Button variant="danger" onClick={handleCancel} loading={updating}>
              Anular Factura
            </Button>
            <Button variant="outline" onClick={() => { setShowCancelModal(false); setCancelComment("") }}>
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
