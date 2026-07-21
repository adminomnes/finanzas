"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Modal } from "@/components/ui/modal"
import { Layers, Plus } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import toast from "react-hot-toast"

interface CostCenter {
  id: string
  name: string
  code: string
  budget: number | null
  isActive: boolean
}

export default function CostCentersPage() {
  const [centers, setCenters] = useState<CostCenter[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: "", code: "", budget: "" })

  const fetchCenters = async () => {
    try {
      const res = await fetch("/api/cost-centers")
      if (res.ok) {
        const data = await res.json()
        setCenters(data.data)
      }
    } catch {
      toast.error("Error al cargar centros de costo")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCenters() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch("/api/cost-centers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, budget: form.budget || null }),
      })
      if (res.ok) {
        toast.success("Centro de costo creado")
        setShowModal(false)
        setForm({ name: "", code: "", budget: "" })
        fetchCenters()
      } else {
        const d = await res.json()
        toast.error(d.error || "Error")
      }
    } catch {
      toast.error("Error de conexión")
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#F0FDF4]">
            <Layers className="h-5 w-5 text-[#16A34A]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#1E293B]">Centros de Costo</h2>
            <p className="text-sm text-[#64748B]">Gestión de centros de costo</p>
          </div>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4" /> Nuevo Centro
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-[#94A3B8]">Cargando...</div>
          ) : centers.length === 0 ? (
            <div className="p-12 text-center">
              <Layers className="h-12 w-12 text-[#E2E8F0] mx-auto mb-3" />
              <p className="text-[#64748B]">No hay centros de costo</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E2E8F0]">
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase">Código</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase">Nombre</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase">Presupuesto</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {centers.map((cc) => (
                    <tr key={cc.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-4 py-3 text-sm font-mono font-medium text-[#2563EB]">{cc.code}</td>
                      <td className="px-4 py-3 text-sm font-medium text-[#1E293B]">{cc.name}</td>
                      <td className="px-4 py-3 text-sm text-right text-[#1E293B]">
                        {cc.budget ? formatCurrency(cc.budget) : "-"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${cc.isActive ? "bg-[#F0FDF4] text-[#16A34A]" : "bg-[#FEF2F2] text-[#DC2626]"}`}>
                          {cc.isActive ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nuevo Centro de Costo">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Input id="name" label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input id="code" label="Código" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
          </div>
          <Input id="budget" label="Presupuesto ($)" type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
          <div className="flex items-center gap-3 pt-2">
            <Button type="submit">Crear</Button>
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
