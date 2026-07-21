"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Plus, History, Star, Bug, Shield, PlusCircle } from "lucide-react"
import toast from "react-hot-toast"

export default function ChangelogPage() {
  const [items, setItems] = useState<any[]>([])
  const [versions, setVersions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  
  const [form, setForm] = useState({
    releaseDate: "",
    description: "",
    features: "",
    fixes: "",
    securityChanges: "",
    versionId: "",
  })

  const fetchData = async () => {
    try {
      const [resChange, resVersions] = await Promise.all([
        fetch("/api/development/changelog"),
        fetch("/api/development/versions"),
      ])
      if (resChange.ok && resVersions.ok) {
        const dataC = await resChange.json()
        const dataV = await resVersions.json()
        setItems(dataC.data)
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
      const res = await fetch("/api/development/changelog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      toast.success("Changelog registrado exitosamente")
      setShowModal(false)
      setForm({ releaseDate: "", description: "", features: "", fixes: "", securityChanges: "", versionId: "" })
      fetchData()
    } catch {
      toast.error("Error al registrar changelog")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-[#1E293B]">Historial de Versiones (Changelog)</h2>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4" />
          Registrar Cambios
        </Button>
      </div>

      <div className="space-y-6">
        {loading ? (
          <div className="p-12 text-center text-[#94A3B8]">Cargando historial...</div>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <History className="h-12 w-12 text-[#E2E8F0] mx-auto mb-3" />
              <p className="text-[#64748B]">No hay historial registrado</p>
            </CardContent>
          </Card>
        ) : (
          <div className="relative border-l-2 border-[#E2E8F0] ml-3 pl-6 space-y-10">
            {items.map((item) => (
              <div key={item.id} className="relative">
                <div className="absolute -left-[35px] bg-[#2563EB] w-4 h-4 rounded-full border-4 border-white shadow-sm" />
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-xl font-bold text-[#1E293B]">
                            {item.version ? item.version.version : "Actualización"}
                          </h3>
                          {item.version && (
                            <Badge variant={item.version.type === "PRODUCCION" ? "success" : "info"}>
                              {item.version.type}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium text-[#64748B]">
                          {new Date(item.releaseDate).toLocaleDateString("es-CL", {
                            year: 'numeric', month: 'long', day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>

                    <p className="text-[#334155] mb-6">{item.description}</p>

                    <div className="space-y-4">
                      {item.features && (
                        <div>
                          <h4 className="flex items-center gap-2 font-semibold text-green-700 mb-2">
                            <PlusCircle className="h-4 w-4" /> Nuevas Funcionalidades
                          </h4>
                          <div className="text-sm text-[#475569] whitespace-pre-line pl-6">
                            {item.features}
                          </div>
                        </div>
                      )}
                      
                      {item.fixes && (
                        <div>
                          <h4 className="flex items-center gap-2 font-semibold text-amber-600 mb-2">
                            <Bug className="h-4 w-4" /> Errores Corregidos
                          </h4>
                          <div className="text-sm text-[#475569] whitespace-pre-line pl-6">
                            {item.fixes}
                          </div>
                        </div>
                      )}

                      {item.securityChanges && (
                        <div>
                          <h4 className="flex items-center gap-2 font-semibold text-blue-600 mb-2">
                            <Shield className="h-4 w-4" /> Mejoras de Seguridad
                          </h4>
                          <div className="text-sm text-[#475569] whitespace-pre-line pl-6">
                            {item.securityChanges}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Registrar Cambios">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              id="versionId"
              label="Versión"
              options={versions.map(v => ({ value: v.id, label: v.version }))}
              value={form.versionId}
              onChange={(e) => setForm({ ...form, versionId: e.target.value })}
              required
            />
            <Input
              id="releaseDate"
              label="Fecha de Lanzamiento"
              type="date"
              value={form.releaseDate}
              onChange={(e) => setForm({ ...form, releaseDate: e.target.value })}
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#1E293B]">Descripción General</label>
            <textarea
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-green-700">Nuevas Funcionalidades</label>
            <textarea
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg"
              rows={3}
              placeholder="- Agregado módulo de cobros"
              value={form.features}
              onChange={(e) => setForm({ ...form, features: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-amber-600">Errores Corregidos</label>
            <textarea
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg"
              rows={3}
              placeholder="- Corrección de error 500 al eliminar factura"
              value={form.fixes}
              onChange={(e) => setForm({ ...form, fixes: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button type="submit">Guardar Changelog</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}


