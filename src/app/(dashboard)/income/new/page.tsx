"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { ArrowUpCircle, ArrowLeft } from "lucide-react"
import toast from "react-hot-toast"

interface Option {
  value: string
  label: string
}

export default function NewIncomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [companies, setCompanies] = useState<Option[]>([])
  const [categories, setCategories] = useState<Option[]>([])

  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    companyId: "",
    categoryId: "",
    description: "",
    netAmount: "",
    taxAmount: "0",
    totalAmount: "",
    paymentMethod: "TRANSFERENCIA",
    notes: "",
  })

  useEffect(() => {
    const fetchData = async () => {
      const [compRes, catRes] = await Promise.all([
        fetch("/api/companies"),
        fetch("/api/categories?type=INCOME"),
      ])

      if (compRes.ok) {
        const d = await compRes.json()
        setCompanies(d.data.map((c: { id: string; name: string }) => ({ value: c.id, label: c.name })))
      }
      if (catRes.ok) {
        const d = await catRes.json()
        setCategories(d.data.map((c: { id: string; name: string }) => ({ value: c.id, label: c.name })))
      }
    }
    fetchData()
  }, [])

  const updateField = (field: string, value: string) => {
    const newForm = { ...form, [field]: value }

    if (field === "netAmount" || field === "taxAmount") {
      const net = parseFloat(field === "netAmount" ? value : form.netAmount) || 0
      const tax = parseFloat(field === "taxAmount" ? value : form.taxAmount) || 0
      newForm.totalAmount = (net + tax).toString()
    }

    setForm(newForm)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.companyId || !form.categoryId || !form.description || !form.netAmount) {
      toast.error("Complete todos los campos requeridos")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/income", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          netAmount: parseFloat(form.netAmount),
          taxAmount: parseFloat(form.taxAmount),
          totalAmount: parseFloat(form.totalAmount) || parseFloat(form.netAmount),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Error al crear ingreso")
        return
      }

      toast.success("Ingreso creado exitosamente")
      router.push("/income")
    } catch {
      toast.error("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  const paymentMethods = [
    { value: "TRANSFERENCIA", label: "Transferencia" },
    { value: "EFECTIVO", label: "Efectivo" },
    { value: "TARJETA_CREDITO", label: "Tarjeta Crédito" },
    { value: "TARJETA_DEBITO", label: "Tarjeta Débito" },
    { value: "CHEQUE", label: "Cheque" },
  ]

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg text-[#64748B] hover:bg-[#F1F5F9] transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#F0FDF4]">
            <ArrowUpCircle className="h-5 w-5 text-[#16A34A]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#1E293B]">Nuevo Ingreso</h2>
            <p className="text-sm text-[#64748B]">
              Registre un nuevo ingreso en el sistema
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                id="date"
                label="Fecha"
                type="date"
                value={form.date}
                onChange={(e) => updateField("date", e.target.value)}
                required
              />
              <Select
                id="companyId"
                label="Empresa"
                placeholder="Seleccione empresa"
                options={companies}
                value={form.companyId}
                onChange={(e) => updateField("companyId", e.target.value)}
                required
              />
            </div>

            <Select
              id="categoryId"
              label="Categoría"
              placeholder="Seleccione categoría"
              options={categories}
              value={form.categoryId}
              onChange={(e) => updateField("categoryId", e.target.value)}
              required
            />

            <Input
              id="description"
              label="Descripción"
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              required
            />

            <div className="grid gap-4 md:grid-cols-3">
              <Input
                id="netAmount"
                label="Neto ($)"
                type="number"
                value={form.netAmount}
                onChange={(e) => updateField("netAmount", e.target.value)}
                required
              />
              <Input
                id="taxAmount"
                label="IVA ($)"
                type="number"
                value={form.taxAmount}
                onChange={(e) => updateField("taxAmount", e.target.value)}
              />
              <Input
                id="totalAmount"
                label="Total ($)"
                type="number"
                value={form.totalAmount}
                onChange={(e) => updateField("totalAmount", e.target.value)}
              />
            </div>

            <Select
              id="paymentMethod"
              label="Método de Pago"
              options={paymentMethods}
              value={form.paymentMethod}
              onChange={(e) => updateField("paymentMethod", e.target.value)}
            />

            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-1.5">
                Notas
              </label>
              <textarea
                className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] resize-none"
                rows={3}
                value={form.notes}
                onChange={(e) => updateField("notes", e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-[#E2E8F0]">
              <Button type="submit" loading={loading}>
                Guardar Ingreso
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
