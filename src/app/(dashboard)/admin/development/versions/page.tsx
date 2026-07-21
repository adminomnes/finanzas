"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Plus, ListTree, CheckCircle2 } from "lucide-react"
import toast from "react-hot-toast"

export default function VersionsPage() {
  const [versions, setVersions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    version: "",
    type: "PRODUCCION",
    description: "",
    releaseDate: "",
    isCurrent: false,
  })

  const fetchVersions = async () => {
    try {
      const res = await fetch("/api/development/versions")
      if (res.ok) {
        const data = await res.json()
        setVersions(data.data)
      }
    } catch {
      toast.error("Error al cargar versiones")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVersions()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch("/api/development/versions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      toast.success("Versión creada exitosamente")
      setShowModal(false)
      setForm({ version: "", type: "PRODUCCION", description: "", releaseDate: "", isCurrent: false })
      fetchVersions()
    } catch {
      toast.error("Error al crear la versión")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-[#1E293B]">Gestión de Versiones</h2>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4" />
          Nueva Versión
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-[#94A3B8]">Cargando versiones...</div>
          ) : versions.length === 0 ? (
            <div className="p-12 text-center">
              <ListTree className="h-12 w-12 text-[#E2E8F0] mx-auto mb-3" />
              <p className="text-[#64748B]">No hay versiones registradas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E2E8F0]">
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase">Versión</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase">Tipo</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase">Fecha de Salida</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase">Descripción</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {versions.map((v) => (
                    <tr key={v.id} className="hover:bg-[#F8FAFC]">
                      <td className="px-4 py-3 font-semibold text-[#1E293B]">{v.version}</td>
                      <td className="px-4 py-3">
                        <Badge variant={v.type === "PRODUCCION" ? "success" : v.type === "RC" ? "warning" : "info"}>
                          {v.type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#64748B]">
                        {v.releaseDate ? new Date(v.releaseDate).toLocaleDateString("es-CL") : "N/A"}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#64748B] max-w-xs truncate">
                        {v.description || "-"}
                      </td>
                      <td className="px-4 py-3">
                        {v.isCurrent ? (
                          <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full w-max">
                            <CheckCircle2 className="h-3 w-3" />
                            ACTUAL
                          </span>
                        ) : (
                          <span className="text-xs text-[#94A3B8]">Histórico</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nueva Versión">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="version"
            label="Número de Versión (ej: v1.0.0)"
            value={form.version}
            onChange={(e) => setForm({ ...form, version: e.target.value })}
            required
          />
          <Select
            id="type"
            label="Tipo"
            options={[
              { value: "BETA", label: "Beta" },
              { value: "RC", label: "Release Candidate (RC)" },
              { value: "PRODUCCION", label: "Producción" },
            ]}
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          />
          <Input
            id="releaseDate"
            label="Fecha de Salida"
            type="date"
            value={form.releaseDate}
            onChange={(e) => setForm({ ...form, releaseDate: e.target.value })}
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
          <label className="flex items-center gap-2 text-sm text-[#1E293B]">
            <input
              type="checkbox"
              checked={form.isCurrent}
              onChange={(e) => setForm({ ...form, isCurrent: e.target.checked })}
              className="rounded border-[#E2E8F0] text-[#2563EB]"
            />
            Marcar como versión actual
          </label>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button type="submit">Crear Versión</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}


