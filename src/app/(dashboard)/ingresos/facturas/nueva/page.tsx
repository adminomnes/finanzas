"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { formatCurrency } from "@/lib/utils"
import { FileText, ArrowLeft, Plus, Trash2 } from "lucide-react"
import toast from "react-hot-toast"

interface Option {
  value: string
  label: string
}

interface LineItem {
  id: string
  description: string
  quantity: string
  unitValue: string
  discount: string
  total: number
}

let itemCounter = 0
function createItem(): LineItem {
  itemCounter++
  return { id: `item_${itemCounter}`, description: "", quantity: "1", unitValue: "", discount: "0", total: 0 }
}

function calcTotal(item: LineItem): number {
  const qty = parseFloat(item.quantity) || 0
  const uv = parseFloat(item.unitValue) || 0
  const disc = parseFloat(item.discount) || 0
  return qty * uv * (1 - disc / 100)
}

export default function NuevaFacturaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Option[]>([])
  const [companies, setCompanies] = useState<Option[]>([])

  const [form, setForm] = useState({
    issueDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    clientId: "",
    companyId: "",
    currency: "CLP",
    notes: "",
    pdfUrl: "",
    xmlUrl: "",
  })

  const [items, setItems] = useState<LineItem[]>([createItem()])

  useEffect(() => {
    const fetchData = async () => {
      const [cliRes, compRes] = await Promise.all([
        fetch("/api/income/clients"),
        fetch("/api/companies"),
      ])
      if (cliRes.ok) {
        const d = await cliRes.json()
        setClients(d.data.map((c: { id: string; name: string; rut: string }) => ({ value: c.id, label: `${c.name} (${c.rut})` })))
      }
      if (compRes.ok) {
        const d = await compRes.json()
        setCompanies(d.data.map((c: { id: string; name: string }) => ({ value: c.id, label: c.name })))
      }
    }
    fetchData()
  }, [])

  const updateItem = (id: string, field: keyof LineItem, value: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        const updated = { ...item, [field]: value }
        updated.total = calcTotal(updated)
        return updated
      })
    )
  }

  const addItem = () => setItems((prev) => [...prev, createItem()])
  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id))

  const netAmount = items.reduce((sum, i) => sum + i.total, 0)
  const taxAmount = netAmount * 0.19
  const totalAmount = netAmount + taxAmount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.clientId || !form.companyId) {
      toast.error("Complete los campos requeridos")
      return
    }

    if (items.length === 0 || items.every((i) => !i.description || !i.unitValue)) {
      toast.error("Agregue al menos un ítem con descripción y valor")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/income/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          netAmount,
          taxAmount,
          totalAmount,
          items: items.map((i) => ({
            description: i.description,
            quantity: parseFloat(i.quantity) || 1,
            unitValue: parseFloat(i.unitValue) || 0,
            discount: parseFloat(i.discount) || 0,
            total: i.total,
          })),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Error al crear factura")
        return
      }

      toast.success("Factura creada exitosamente")
      router.push("/ingresos/facturas")
    } catch {
      toast.error("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  const currencies = [
    { value: "CLP", label: "CLP - Peso Chileno" },
    { value: "USD", label: "USD - Dólar" },
    { value: "EUR", label: "EUR - Euro" },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg text-[#64748B] hover:bg-[#F1F5F9] transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#EFF6FF]">
            <FileText className="h-5 w-5 text-[#2563EB]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#1E293B]">Nueva Factura</h2>
            <p className="text-sm text-[#64748B]">
              Cree una nueva factura para un cliente
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-[#1E293B] mb-4">Información General</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                id="issueDate"
                label="Fecha Emisión"
                type="date"
                value={form.issueDate}
                onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
                required
              />
              <Input
                id="dueDate"
                label="Fecha Vencimiento"
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
              <Select
                id="clientId"
                label="Cliente"
                placeholder="Seleccione cliente"
                options={clients}
                value={form.clientId}
                onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                required
              />
              <Select
                id="companyId"
                label="Empresa"
                placeholder="Seleccione empresa"
                options={companies}
                value={form.companyId}
                onChange={(e) => setForm({ ...form, companyId: e.target.value })}
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#1E293B]">Detalle de Factura</h3>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4" />
                Agregar Item
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E2E8F0]">
                    <th className="text-left px-2 py-2 text-xs font-medium text-[#94A3B8] uppercase tracking-wider min-w-[200px]">Descripción</th>
                    <th className="text-center px-2 py-2 text-xs font-medium text-[#94A3B8] uppercase tracking-wider w-20">Cantidad</th>
                    <th className="text-right px-2 py-2 text-xs font-medium text-[#94A3B8] uppercase tracking-wider w-28">Valor Unitario</th>
                    <th className="text-right px-2 py-2 text-xs font-medium text-[#94A3B8] uppercase tracking-wider w-24">Descuento (%)</th>
                    <th className="text-right px-2 py-2 text-xs font-medium text-[#94A3B8] uppercase tracking-wider w-28">Total</th>
                    <th className="text-center px-2 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          placeholder="Descripción del ítem"
                          className="w-full px-2 py-1.5 rounded-lg border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                          value={item.description}
                          onChange={(e) => updateItem(item.id, "description", e.target.value)}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          className="w-full px-2 py-1.5 rounded-lg border border-[#E2E8F0] text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, "quantity", e.target.value)}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          className="w-full px-2 py-1.5 rounded-lg border border-[#E2E8F0] text-sm text-right focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                          value={item.unitValue}
                          onChange={(e) => updateItem(item.id, "unitValue", e.target.value)}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          className="w-full px-2 py-1.5 rounded-lg border border-[#E2E8F0] text-sm text-right focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                          value={item.discount}
                          onChange={(e) => updateItem(item.id, "discount", e.target.value)}
                        />
                      </td>
                      <td className="px-2 py-2 text-sm font-semibold text-right text-[#1E293B]">
                        <span className="financial-number">{formatCurrency(item.total)}</span>
                      </td>
                      <td className="px-2 py-2 text-center">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="p-1 rounded-lg text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#FEF2F2] transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-[#1E293B] mb-4">Resumen Financiero</h3>
            <div className="grid gap-4 md:grid-cols-3 max-w-md ml-auto">
              <div className="p-4 rounded-lg bg-[#F8FAFC] text-right">
                <p className="text-xs text-[#64748B] mb-1">Neto</p>
                <p className="text-lg font-semibold text-[#1E293B]">
                  <span className="financial-number">{formatCurrency(netAmount)}</span>
                </p>
              </div>
              <div className="p-4 rounded-lg bg-[#F8FAFC] text-right">
                <p className="text-xs text-[#64748B] mb-1">IVA (19%)</p>
                <p className="text-lg font-semibold text-[#1E293B]">
                  <span className="financial-number">{formatCurrency(taxAmount)}</span>
                </p>
              </div>
              <div className="p-4 rounded-lg bg-[#EFF6FF] text-right">
                <p className="text-xs text-[#2563EB] mb-1">Total</p>
                <p className="text-lg font-semibold text-[#2563EB]">
                  <span className="financial-number">{formatCurrency(totalAmount)}</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-[#1E293B] mb-4">Adicional</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Notas</label>
                <textarea
                  className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] resize-none"
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
              <Select
                id="currency"
                label="Moneda"
                options={currencies}
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
              />
              <div></div>
              <Input
                id="pdfUrl"
                label="PDF URL"
                type="text"
                placeholder="https://..."
                value={form.pdfUrl}
                onChange={(e) => setForm({ ...form, pdfUrl: e.target.value })}
              />
              <Input
                id="xmlUrl"
                label="XML URL"
                type="text"
                placeholder="https://..."
                value={form.xmlUrl}
                onChange={(e) => setForm({ ...form, xmlUrl: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3 pt-4">
          <Button type="submit" loading={loading}>
            Guardar Factura
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  )
}
