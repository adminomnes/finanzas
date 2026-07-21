"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Plus, Lightbulb, MoreVertical } from "lucide-react"
import toast from "react-hot-toast"

export default function BacklogPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "MEDIA",
    status: "IDEA",
  })

  const fetchBacklog = async () => {
    try {
      const res = await fetch("/api/development/backlog")
      if (res.ok) {
        const data = await res.json()
        setItems(data.data)
      }
    } catch {
      toast.error("Error al cargar backlog")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBacklog()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch("/api/development/backlog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      toast.success("Idea guardada exitosamente")
      setShowModal(false)
      setForm({ title: "", description: "", priority: "MEDIA", status: "IDEA" })
      fetchBacklog()
    } catch {
      toast.error("Error al guardar idea")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta idea permanentemente?")) return
    try {
      await fetch(`/api/development/backlog/${id}`, { method: "DELETE" })
      fetchBacklog()
      toast.success("Idea eliminada")
    } catch {
      toast.error("Error al eliminar")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-[#1E293B]">Backlog de Ideas</h2>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4" />
          Nueva Idea
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full p-12 text-center text-[#94A3B8]">Cargando backlog...</div>
        ) : items.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white border border-[#E2E8F0] rounded-xl">
            <Lightbulb className="h-12 w-12 text-[#E2E8F0] mx-auto mb-3" />
            <p className="text-[#64748B]">El backlog está vacío</p>
          </div>
        ) : (
          items.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow relative group">
              <CardContent className="p-5">
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleDelete(item.id)} className="text-[#EF4444] text-xs font-medium hover:underline bg-white px-2 py-1 rounded shadow-sm border border-red-100">
                    Eliminar
                  </button>
                </div>
                
                <div className="flex gap-2 mb-3">
                  <Badge variant={item.priority === "ALTA" || item.priority === "CRITICA" ? "danger" : item.priority === "MEDIA" ? "warning" : "default"}>
                    {item.priority}
                  </Badge>
                  <Badge variant="info">
                    {item.status}
                  </Badge>
                </div>
                
                <h3 className="font-semibold text-[#1E293B] mb-2">{item.title}</h3>
                <p className="text-sm text-[#64748B] mb-4 line-clamp-3">
                  {item.description}
                </p>
                
                <div className="text-xs text-[#94A3B8]">
                  Agregado el {new Date(item.createdAt).toLocaleDateString("es-CL")}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nueva Idea">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="title"
            label="Título de la Idea"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#1E293B]">Descripción / Caso de Uso</label>
            <textarea
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <Select
            id="priority"
            label="Prioridad"
            options={[
              { value: "BAJA", label: "Baja (Nice to have)" },
              { value: "MEDIA", label: "Media" },
              { value: "ALTA", label: "Alta (Importante)" },
              { value: "CRITICA", label: "Crítica (Necesidad Urgente)" },
            ]}
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button type="submit">Guardar Idea</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}


