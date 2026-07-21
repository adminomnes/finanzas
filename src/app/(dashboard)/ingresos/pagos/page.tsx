"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Modal } from "@/components/ui/modal"
import { EmptyState } from "@/components/ui/empty-state"
import { formatCurrency, formatDateShort } from "@/lib/utils"
import {
  DollarSign,
  Search,
  Eye,
  Plus,
  Banknote,
  Calendar,
} from "lucide-react"
import toast from "react-hot-toast"

interface Payment {
  id: string
  date: string
  amount: number
  method: string
  bank: string | null
  account: string | null
  reference: string | null
  notes: string | null
  createdAt: string
  invoice: {
    id: string
    number: string
    client: { id: string; name: string }
  }
  createdBy: { id: string; firstName: string; lastName: string }
}

interface InvoiceOption {
  id: string
  number: string
  client: { id: string; name: string }
}

interface Stats {
  totalCollectedMonth: number
  pendingInvoices: number
  totalPendingAmount: number
  clientsWithDebt: number
}

const paymentMethodLabels: Record<string, string> = {
  TRANSFERENCIA: "Transferencia",
  EFECTIVO: "Efectivo",
  TARJETA_CREDITO: "Tarjeta Crédito",
  TARJETA_DEBITO: "Tarjeta Débito",
  CHEQUE: "Cheque",
}

const paymentMethods = [
  { value: "TRANSFERENCIA", label: "Transferencia" },
  { value: "EFECTIVO", label: "Efectivo" },
  { value: "TARJETA_CREDITO", label: "Tarjeta Crédito" },
  { value: "TARJETA_DEBITO", label: "Tarjeta Débito" },
  { value: "CHEQUE", label: "Cheque" },
]

const methodColors: Record<string, "info" | "success" | "warning" | "default"> = {
  TRANSFERENCIA: "info",
  EFECTIVO: "success",
  TARJETA_CREDITO: "warning",
  TARJETA_DEBITO: "warning",
  CHEQUE: "default",
}

export default function PagosPage() {
  const router = useRouter()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [methodFilter, setMethodFilter] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState<Stats | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [invoiceOptions, setInvoiceOptions] = useState<InvoiceOption[]>([])

  const [form, setForm] = useState({
    invoiceId: "",
    date: new Date().toISOString().split("T")[0],
    amount: "",
    method: "TRANSFERENCIA",
    bank: "",
    account: "",
    reference: "",
    notes: "",
  })

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/income/stats")
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch {
      // silent
    }
  }

  const fetchPayments = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: "20" })
      if (search) params.set("search", search)
      if (methodFilter) params.set("method", methodFilter)
      if (dateFrom) params.set("dateFrom", dateFrom)
      if (dateTo) params.set("dateTo", dateTo)

      const res = await fetch(`/api/income/payments?${params}`)
      if (res.ok) {
        const data = await res.json()
        setPayments(data.data)
        setTotalPages(data.totalPages)
      }
    } catch {
      toast.error("Error al cargar pagos")
    } finally {
      setLoading(false)
    }
  }

  const fetchInvoices = async () => {
    try {
      const res = await fetch("/api/income/invoices?status=PENDIENTE_PAGO,ENVIADA,EMITIDA")
      if (res.ok) {
        const data = await res.json()
        setInvoiceOptions(data.data || data)
      }
    } catch {
      // silent
    }
  }

  useEffect(() => {
    fetchStats()
    fetchPayments()
  }, [page, methodFilter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchPayments()
  }

  const openModal = () => {
    fetchInvoices()
    setForm({
      invoiceId: "",
      date: new Date().toISOString().split("T")[0],
      amount: "",
      method: "TRANSFERENCIA",
      bank: "",
      account: "",
      reference: "",
      notes: "",
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.invoiceId || !form.date || !form.amount) {
      toast.error("Completa los campos obligatorios")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/income/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: form.invoiceId,
          date: form.date,
          amount: Number.parseFloat(form.amount),
          method: form.method,
          bank: form.bank || undefined,
          account: form.account || undefined,
          reference: form.reference || undefined,
          notes: form.notes || undefined,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success("Pago registrado exitosamente")
      setModalOpen(false)
      fetchPayments()
      fetchStats()
    } catch {
      toast.error("Error al registrar pago")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#EFF6FF]">
            <Banknote className="h-5 w-5 text-[#2563EB]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#1E293B]">Pagos Recibidos</h2>
            <p className="text-sm text-[#64748B]">Registro de pagos y cobranza</p>
          </div>
        </div>
        <Button onClick={openModal}>
          <Plus className="h-4 w-4" />
          Registrar Pago
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-[#64748B] uppercase tracking-wider">Cobrado del Mes</span>
                <div className="p-1.5 rounded-lg bg-[#F0FDF4]">
                  <DollarSign className="h-4 w-4 text-[#16A34A]" />
                </div>
              </div>
              <p className="text-xl font-bold text-[#1E293B]">{formatCurrency(stats.totalCollectedMonth)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-[#64748B] uppercase tracking-wider">Facturas Pendientes</span>
                <div className="p-1.5 rounded-lg bg-[#FFFBEB]">
                  <Calendar className="h-4 w-4 text-[#D97706]" />
                </div>
              </div>
              <p className="text-xl font-bold text-[#1E293B]">{stats.pendingInvoices}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-[#64748B] uppercase tracking-wider">Monto por Cobrar</span>
                <div className="p-1.5 rounded-lg bg-[#FEF2F2]">
                  <DollarSign className="h-4 w-4 text-[#EF4444]" />
                </div>
              </div>
              <p className="text-xl font-bold text-[#1E293B]">{formatCurrency(stats.totalPendingAmount)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-[#64748B] uppercase tracking-wider">Clientes con Deuda</span>
                <div className="p-1.5 rounded-lg bg-[#F1F5F9]">
                  <DollarSign className="h-4 w-4 text-[#64748B]" />
                </div>
              </div>
              <p className="text-xl font-bold text-[#1E293B]">{stats.clientsWithDebt}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <form onSubmit={handleSearch} className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Buscar pagos..."
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </form>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
              className="px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
              className="px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
            />
            <select
              className="px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
              value={methodFilter}
              onChange={(e) => { setMethodFilter(e.target.value); setPage(1) }}
            >
              <option value="">Todos los métodos</option>
              {paymentMethods.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-[#94A3B8]">Cargando pagos...</div>
          ) : payments.length === 0 ? (
            <EmptyState
              icon={<Banknote className="h-6 w-6" />}
              title="No hay pagos registrados"
              description="Los pagos recibidos aparecerán aquí una vez registrados."
              action={
                <Button variant="outline" onClick={openModal}>
                  <Plus className="h-4 w-4" />
                  Registrar Pago
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E2E8F0]">
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Fecha</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Factura N°</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Cliente</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Monto</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Método</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Banco</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Referencia</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Creado por</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-4 py-3 text-sm text-[#64748B]">{formatDateShort(payment.date)}</td>
                      <td className="px-4 py-3 text-sm font-medium text-[#1E293B]">{payment.invoice.number}</td>
                      <td className="px-4 py-3 text-sm text-[#64748B]">{payment.invoice.client.name}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-right text-[#1E293B]">{formatCurrency(payment.amount)}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={methodColors[payment.method] || "default"}>
                          {paymentMethodLabels[payment.method] || payment.method}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#64748B]">{payment.bank || "-"}</td>
                      <td className="px-4 py-3 text-sm text-[#64748B]">{payment.reference || "-"}</td>
                      <td className="px-4 py-3 text-sm text-[#64748B]">{payment.createdBy.firstName} {payment.createdBy.lastName}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => router.push(`/ingresos/pagos/${payment.id}`)}
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
              <span className="text-sm text-[#64748B]">Página {page} de {totalPages}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  Anterior
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Registrar Pago" subtitle="Ingresa los datos del pago recibido" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Factura *"
            id="invoiceId"
            placeholder="Seleccionar factura"
            options={invoiceOptions.map((inv) => ({
              value: inv.id,
              label: `${inv.number} - ${inv.client.name}`,
            }))}
            value={form.invoiceId}
            onChange={(e) => setForm({ ...form, invoiceId: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Fecha *"
              id="date"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
            <Input
              label="Monto *"
              id="amount"
              type="number"
              placeholder="0"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </div>
          <Select
            label="Método Pago"
            id="method"
            options={paymentMethods}
            value={form.method}
            onChange={(e) => setForm({ ...form, method: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Banco"
              id="bank"
              placeholder="Nombre del banco"
              value={form.bank}
              onChange={(e) => setForm({ ...form, bank: e.target.value })}
            />
            <Input
              label="Cuenta"
              id="account"
              placeholder="N° de cuenta"
              value={form.account}
              onChange={(e) => setForm({ ...form, account: e.target.value })}
            />
          </div>
          <Input
            label="Referencia"
            id="reference"
            placeholder="N° de referencia o comprobante"
            value={form.reference}
            onChange={(e) => setForm({ ...form, reference: e.target.value })}
          />
          <div className="space-y-1.5">
            <label htmlFor="notes" className="block text-sm font-medium text-[#1E293B]">Notas</label>
            <textarea
              id="notes"
              rows={3}
              className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm text-[#1E293B] placeholder:text-[#94A3B8] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
              placeholder="Notas adicionales..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={submitting}>Registrar Pago</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
