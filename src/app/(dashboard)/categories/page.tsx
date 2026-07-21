"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Modal } from "@/components/ui/modal"
import { Tags, Plus } from "lucide-react"
import toast from "react-hot-toast"

interface Category {
  id: string
  name: string
  type: string
  color: string
  icon: string
  isActive: boolean
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: "", type: "EXPENSE", color: "#6366F1", icon: "file-text" })

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories")
      if (res.ok) {
        const data = await res.json()
        setCategories(data.data)
      }
    } catch {
      toast.error("Error al cargar categorías")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCategories() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast.success("Categoría creada")
        setShowModal(false)
        setForm({ name: "", type: "EXPENSE", color: "#6366F1", icon: "file-text" })
        fetchCategories()
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
            <Tags className="h-5 w-5 text-[#16A34A]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#1E293B]">Categorías</h2>
            <p className="text-sm text-[#64748B]">Gestión de categorías de gastos e ingresos</p>
          </div>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4" /> Nueva Categoría
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-[#94A3B8]">Cargando...</div>
          ) : categories.length === 0 ? (
            <div className="p-12 text-center">
              <Tags className="h-12 w-12 text-[#E2E8F0] mx-auto mb-3" />
              <p className="text-[#64748B]">No hay categorías</p>
            </div>
          ) : (
            <div className="grid gap-3 p-4 md:grid-cols-2 lg:grid-cols-3">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center gap-3 p-3 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: cat.color + "20" }}>
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1E293B] truncate">{cat.name}</p>
                    <Badge variant={cat.type === "EXPENSE" ? "danger" : "success"}>
                      {cat.type === "EXPENSE" ? "Gasto" : "Ingreso"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nueva Categoría">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input id="name" label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Select id="type" label="Tipo" options={[{ value: "EXPENSE", label: "Gasto" }, { value: "INCOME", label: "Ingreso" }]} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
          <Input id="color" label="Color" type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
          <div className="flex items-center gap-3 pt-2">
            <Button type="submit">Crear</Button>
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
