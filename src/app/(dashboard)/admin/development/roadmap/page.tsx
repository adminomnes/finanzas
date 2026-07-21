"use client"

import { useEffect, useState } from "react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Plus, Map, GripVertical } from "lucide-react"
import toast from "react-hot-toast"

export default function RoadmapPage() {
  const [items, setItems] = useState<any[]>([])
  const [versions, setVersions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  
  const [form, setForm] = useState({
    name: "",
    description: "",
    priority: "MEDIA",
    status: "PENDIENTE",
    versionId: "",
  })

  const fetchData = async () => {
    try {
      const [resRoadmap, resVersions] = await Promise.all([
        fetch("/api/development/roadmap"),
        fetch("/api/development/versions"),
      ])
      if (resRoadmap.ok && resVersions.ok) {
        const dataR = await resRoadmap.json()
        const dataV = await resVersions.json()
        setItems(dataR.data)
        setVersions(dataV.data)
      }
    } catch {
      toast.error("Error al cargar datos")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch("/api/development/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      toast.success("Módulo creado exitosamente")
      setShowModal(false)
      setForm({ name: "", description: "", priority: "MEDIA", status: "PENDIENTE", versionId: "" })
      fetchData()
    } catch {
      toast.error("Error al crear módulo")
    }
  }

  const onDragEnd = async (result: any) => {
    if (!result.destination) return
    const newItems = Array.from(items)
    const [reorderedItem] = newItems.splice(result.source.index, 1)
    newItems.splice(result.destination.index, 0, reorderedItem)
    setItems(newItems)

    const reorderedData = newItems.map((item, index) => ({ id: item.id, orderIndex: index }))
    try {
      await fetch("/api/development/roadmap/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: reorderedData }),
      })
    } catch {
      toast.error("Error al reordenar")
    }
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await fetch(`/api/development/roadmap/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      fetchData()
      toast.success("Estado actualizado")
    } catch {
      toast.error("Error al actualizar")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-[#1E293B]">Roadmap del Producto</h2>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4" />
          Nuevo Módulo
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          {loading ? (
            <div className="p-12 text-center text-[#94A3B8]">Cargando roadmap...</div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center">
              <Map className="h-12 w-12 text-[#E2E8F0] mx-auto mb-3" />
              <p className="text-[#64748B]">No hay módulos en el roadmap</p>
            </div>
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="roadmap">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                    {items.map((item, index) => (
                      <Draggable key={item.id} draggableId={item.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`flex items-center p-4 border rounded-xl bg-white transition-shadow ${
                              snapshot.isDragging ? "shadow-lg border-[#2563EB]" : "border-[#E2E8F0] hover:border-[#CBD5E1]"
                            }`}
                          >
                            <div {...provided.dragHandleProps} className="mr-4 text-[#94A3B8] cursor-grab">
                              <GripVertical className="h-5 w-5" />
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-[#1E293B]">{item.name}</h4>
                                {item.version && (
                                  <Badge variant="info">{item.version.version}</Badge>
                                )}
                              </div>
                              <p className="text-sm text-[#64748B]">{item.description}</p>
                            </div>

                            <div className="flex items-center gap-4">
                              <Badge variant={item.priority === "ALTA" || item.priority === "CRITICA" ? "danger" : "default"}>
                                {item.priority}
                              </Badge>
                              
                              <select
                                className="text-sm border-0 bg-transparent text-[#64748B] font-medium focus:ring-0 cursor-pointer"
                                value={item.status}
                                onChange={(e) => handleStatusChange(item.id, e.target.value)}
                              >
                                <option value="PENDIENTE">Pendiente</option>
                                <option value="EN_DESARROLLO">En Desarrollo</option>
                                <option value="EN_PRUEBAS">En Pruebas</option>
                                <option value="FINALIZADO">Finalizado</option>
                                <option value="CANCELADO">Cancelado</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nuevo Módulo">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="name"
            label="Nombre del Módulo"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#1E293B]">Descripción</label>
            <textarea
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              id="priority"
              label="Prioridad"
              options={[
                { value: "BAJA", label: "Baja" },
                { value: "MEDIA", label: "Media" },
                { value: "ALTA", label: "Alta" },
                { value: "CRITICA", label: "Crítica" },
              ]}
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            />
            <Select
              id="versionId"
              label="Versión Objetivo"
              options={[{ value: "", label: "Ninguna" }, ...versions.map(v => ({ value: v.id, label: v.version }))]}
              value={form.versionId}
              onChange={(e) => setForm({ ...form, versionId: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button type="submit">Guardar</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}


