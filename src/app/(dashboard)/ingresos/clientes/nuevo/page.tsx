"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Users, ArrowLeft } from "lucide-react"
import toast from "react-hot-toast"

const typeOptions = [
  { value: "EMPRESA", label: "Empresa" },
  { value: "PERSONA", label: "Persona" },
]

export default function NewClientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: "",
    rut: "",
    type: "EMPRESA",
    address: "",
    phone: "",
    email: "",
    contact: "",
    paymentTerms: "30",
  })

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.name || !form.rut) {
      toast.error("Complete los campos requeridos")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/income/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Error al crear cliente")
        return
      }

      toast.success("Cliente creado exitosamente")
      router.push("/ingresos/clientes")
    } catch {
      toast.error("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

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
          <div className="p-2 rounded-lg bg-[#EFF6FF]">
            <Users className="h-5 w-5 text-[#2563EB]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#1E293B]">Nuevo Cliente</h2>
            <p className="text-sm text-[#64748B]">
              Registre un nuevo cliente en el sistema
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-[#1E293B] mb-4">
                Datos Generales
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  id="name"
                  label="Nombre"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  required
                />
                <Input
                  id="rut"
                  label="RUT"
                  value={form.rut}
                  onChange={(e) => updateField("rut", e.target.value)}
                  required
                />
                <Select
                  id="type"
                  label="Tipo"
                  options={typeOptions}
                  value={form.type}
                  onChange={(e) => updateField("type", e.target.value)}
                />
                <Input
                  id="address"
                  label="Dirección"
                  value={form.address}
                  onChange={(e) => updateField("address", e.target.value)}
                />
                <Input
                  id="phone"
                  label="Teléfono"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                />
                <Input
                  id="email"
                  label="Correo"
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                />
              </div>
            </div>

            <div className="border-t border-[#E2E8F0] pt-6">
              <h3 className="text-sm font-semibold text-[#1E293B] mb-4">
                Información Comercial
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  id="contact"
                  label="Contacto Principal"
                  value={form.contact}
                  onChange={(e) => updateField("contact", e.target.value)}
                />
                <Input
                  id="paymentTerms"
                  label="Condición de Pago"
                  value={form.paymentTerms}
                  onChange={(e) => updateField("paymentTerms", e.target.value)}
                  hint="Días para pago"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-[#E2E8F0]">
              <Button type="submit" loading={loading}>
                Guardar Cliente
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
