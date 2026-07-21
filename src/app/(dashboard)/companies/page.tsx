"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Modal } from "@/components/ui/modal"
import { Building, Plus } from "lucide-react"
import toast from "react-hot-toast"

interface Company {
  id: string
  name: string
  rut: string
  address: string | null
  phone: string | null
  email: string | null
  isActive: boolean
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: "", rut: "", address: "", phone: "", email: "" })

  const fetchCompanies = async () => {
    try {
      const res = await fetch("/api/companies")
      if (res.ok) {
        const data = await res.json()
        setCompanies(data.data)
      }
    } catch {
      toast.error("Error al cargar empresas")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCompanies() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast.success("Empresa creada")
        setShowModal(false)
        setForm({ name: "", rut: "", address: "", phone: "", email: "" })
        fetchCompanies()
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
          <div className="p-2 rounded-lg bg-[#EFF6FF]">
            <Building className="h-5 w-5 text-[#2563EB]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#1E293B]">Empresas</h2>
            <p className="text-sm text-[#64748B]">Gestión de empresas del holding</p>
          </div>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4" /> Nueva Empresa
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-[#94A3B8]">Cargando...</div>
          ) : companies.length === 0 ? (
            <div className="p-12 text-center">
              <Building className="h-12 w-12 text-[#E2E8F0] mx-auto mb-3" />
              <p className="text-[#64748B]">No hay empresas registradas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E2E8F0]">
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase">Nombre</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase">RUT</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase">Dirección</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase">Contacto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {companies.map((c) => (
                    <tr key={c.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-[#1E293B]">{c.name}</td>
                      <td className="px-4 py-3 text-sm text-[#64748B]">{c.rut}</td>
                      <td className="px-4 py-3 text-sm text-[#64748B]">{c.address || "-"}</td>
                      <td className="px-4 py-3 text-sm text-[#64748B]">{c.email || c.phone || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nueva Empresa">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input id="name" label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input id="rut" label="RUT" value={form.rut} onChange={(e) => setForm({ ...form, rut: e.target.value })} required />
          <Input id="address" label="Dirección" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <div className="grid gap-4 md:grid-cols-2">
            <Input id="phone" label="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input id="email" label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Button type="submit">Crear</Button>
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
