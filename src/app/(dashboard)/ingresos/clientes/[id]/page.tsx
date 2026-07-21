"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/utils"
import { ArrowLeft, Users, Building, Eye } from "lucide-react"
import toast from "react-hot-toast"

interface ClientInvoice {
  id: string
  number: string
  date: string
  totalAmount: number
  status: string
}

interface ClientDetail {
  id: string
  name: string
  rut: string
  type: "EMPRESA" | "PERSONA"
  address: string | null
  phone: string | null
  email: string | null
  contact: string | null
  paymentTerms: string | null
  isActive: boolean
  totalBilled: number
  invoicesCount: number
  paymentsCount: number
  createdAt: string
  invoices: ClientInvoice[]
}

const invoiceStatusVariant: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
  BORRADOR: "default",
  EMITIDA: "info",
  ENVIADA: "warning",
  PENDIENTE_PAGO: "warning",
  PAGADA: "success",
  VENCIDA: "danger",
  ANULADA: "default",
}

const invoiceStatusLabels: Record<string, string> = {
  BORRADOR: "Borrador",
  EMITIDA: "Emitida",
  ENVIADA: "Enviada",
  PENDIENTE_PAGO: "Pendiente Pago",
  PAGADA: "Pagada",
  VENCIDA: "Vencida",
  ANULADA: "Anulada",
}

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [client, setClient] = useState<ClientDetail | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchClient = async () => {
    try {
      const res = await fetch(`/api/income/clients/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setClient(data.data)
      }
    } catch {
      toast.error("Error al cargar cliente")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClient()
  }, [params.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[#64748B]">Cargando...</p>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[#64748B]">Cliente no encontrado</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg text-[#64748B] hover:bg-[#F1F5F9] transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-3 flex-1">
          <div className="p-2 rounded-lg bg-[#EFF6FF]">
            <Users className="h-5 w-5 text-[#2563EB]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#1E293B]">{client.name}</h2>
            <p className="text-sm text-[#64748B]">{client.rut}</p>
          </div>
        </div>
        <Badge variant={client.isActive ? "success" : "default"}>
          {client.isActive ? "Activo" : "Inactivo"}
        </Badge>
        <Button variant="outline" size="sm">
          Editar
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-[#1E293B] mb-4">
              Datos Generales
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-[#64748B]">Nombre</span>
                <span className="text-sm font-medium text-[#1E293B]">{client.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#64748B]">RUT</span>
                <span className="text-sm font-medium text-[#1E293B]">{client.rut}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#64748B]">Tipo</span>
                <div className="flex items-center gap-1.5">
                  {client.type === "EMPRESA" ? (
                    <Building className="h-3.5 w-3.5 text-[#2563EB]" />
                  ) : (
                    <Users className="h-3.5 w-3.5 text-[#14B8A6]" />
                  )}
                  <span className="text-sm font-medium text-[#1E293B]">
                    {client.type === "EMPRESA" ? "Empresa" : "Persona"}
                  </span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#64748B]">Dirección</span>
                <span className="text-sm font-medium text-[#1E293B]">{client.address || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#64748B]">Teléfono</span>
                <span className="text-sm font-medium text-[#1E293B]">{client.phone || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#64748B]">Correo</span>
                <span className="text-sm font-medium text-[#1E293B]">{client.email || "—"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-[#1E293B] mb-4">
              Información Comercial
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-[#64748B]">Contacto Principal</span>
                <span className="text-sm font-medium text-[#1E293B]">{client.contact || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#64748B]">Condición de Pago</span>
                <span className="text-sm font-medium text-[#1E293B]">
                  {client.paymentTerms ? `${client.paymentTerms} días` : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#64748B]">Creado</span>
                <span className="text-sm font-medium text-[#1E293B]">{formatDate(client.createdAt)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold text-[#1E293B] mb-4">
            Resumen Financiero
          </h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg bg-[#F8FAFC]">
              <p className="text-xs text-[#64748B] mb-1">Total Facturado</p>
              <p className="text-lg font-semibold text-[#1E293B] financial-number">
                {formatCurrency(client.totalBilled)}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-[#F8FAFC]">
              <p className="text-xs text-[#64748B] mb-1">Facturas Emitidas</p>
              <p className="text-lg font-semibold text-[#1E293B]">{client.invoicesCount}</p>
            </div>
            <div className="p-4 rounded-lg bg-[#F8FAFC]">
              <p className="text-xs text-[#64748B] mb-1">Pagos Registrados</p>
              <p className="text-lg font-semibold text-[#1E293B]">{client.paymentsCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="p-6 pb-0">
            <h3 className="text-sm font-semibold text-[#1E293B]">Facturas</h3>
          </div>
          {client.invoices.length === 0 ? (
            <div className="p-12 text-center text-[#64748B] text-sm">
              No hay facturas asociadas a este cliente
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E2E8F0]">
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">N° Factura</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Fecha</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Total</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Estado</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {client.invoices.map((inv) => (
                    <tr
                      key={inv.id}
                      className="hover:bg-[#F8FAFC] transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-[#1E293B]">
                        {inv.number}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#64748B]">
                        {formatDate(inv.date)}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-right text-[#1E293B] financial-number">
                        {formatCurrency(inv.totalAmount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={invoiceStatusVariant[inv.status] || "default"}>
                          {invoiceStatusLabels[inv.status] || inv.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => router.push(`/ingresos/facturas/${inv.id}`)}
                          className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#2563EB] hover:bg-[#EFF6FF] transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
