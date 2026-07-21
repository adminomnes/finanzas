"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ScrollText, ArrowLeft, ArrowDown, Clock,
  Monitor, Globe, Smartphone, User,
  Shield, Tag, FileText,
} from "lucide-react"
import { formatDate } from "@/lib/utils"

interface ChangeEntry {
  field: string
  oldValue: string
  newValue: string
}

interface AuditDetail {
  id: string
  auditId: string
  action: string
  module: string | null
  entity: string
  entityId: string | null
  description: string
  role: string | null
  ipAddress: string | null
  userAgent: string | null
  browser: string | null
  os: string | null
  device: string | null
  oldValue: unknown
  newValue: unknown
  createdAt: string
  changes: ChangeEntry[]
  user: { id: string; firstName: string; lastName: string; email: string; role: string }
}

const actionLabels: Record<string, string> = {
  CREATE: "Creación", UPDATE: "Modificación", DELETE: "Eliminación",
  LOGIN: "Inicio de Sesión", LOGIN_FAILED: "Fallo de Login", LOGOUT: "Cierre de Sesión",
  PERMISSION_CHANGE: "Cambio de Permisos", PASSWORD_CHANGE: "Cambio de Contraseña",
  PASSWORD_RESET: "Restablecimiento de Contraseña", ACCOUNT_LOCK: "Bloqueo de Cuenta",
  APPROVE: "Aprobación", REJECT: "Rechazo", EXPORT: "Exportación",
}

const fieldLabels: Record<string, string> = {
  firstName: "Nombre", lastName: "Apellido", email: "Email",
  role: "Rol", isActive: "Activo", status: "Estado",
  totalAmount: "Monto Total", netAmount: "Monto Neto",
  taxAmount: "IVA", description: "Descripción",
  name: "Nombre", rut: "RUT", address: "Dirección",
  phone: "Teléfono", contact: "Contacto",
  code: "Código", budget: "Presupuesto",
  passwordHash: "Contraseña", documentType: "Tipo Documento",
  documentNumber: "N° Documento", paymentMethod: "Método Pago",
  companyId: "Empresa", supplierId: "Proveedor",
  categoryId: "Categoría", costCenterId: "Centro Costo",
  responsibleId: "Responsable",
}

export default function AuditDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [detail, setDetail] = useState<AuditDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/auditoria/${params.id}`)
        if (res.ok) setDetail((await res.json()).data)
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    if (params.id) fetchDetail()
  }, [params.id])

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-[#94A3B8]">Cargando detalle...</div>
  )

  if (!detail) return (
    <div className="flex items-center justify-center h-64 text-[#DC2626]">Registro no encontrado</div>
  )

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-[#F1F5F9] transition-colors">
          <ArrowLeft className="h-5 w-5 text-[#64748B]" />
        </button>
        <div className="p-2 rounded-lg bg-[#F0FDF4]">
          <ScrollText className="h-5 w-5 text-[#16A34A]" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[#1E293B]">{detail.auditId}</h2>
          <p className="text-sm text-[#64748B]">{detail.description}</p>
        </div>
        <Badge variant="info">{detail.entity}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-5 space-y-4">
            <h3 className="text-sm font-semibold text-[#1E293B] flex items-center gap-2">
              <User className="h-4 w-4 text-[#64748B]" /> Información del Evento
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between py-1">
                <span className="text-sm text-[#64748B]">Usuario</span>
                <span className="text-sm font-medium text-[#1E293B]">{detail.user.firstName} {detail.user.lastName}</span>
              </div>
              <div className="flex justify-between py-1 border-t border-[#E2E8F0]">
                <span className="text-sm text-[#64748B]">Email</span>
                <span className="text-sm text-[#1E293B]">{detail.user.email}</span>
              </div>
              <div className="flex justify-between py-1 border-t border-[#E2E8F0]">
                <span className="text-sm text-[#64748B]">Rol</span>
                <Badge variant={detail.role === "SUPER_ADMIN" ? "info" : detail.role === "ADMIN" ? "warning" : "default"}>
                  {detail.role === "SUPER_ADMIN" ? "Super Admin" : detail.role === "ADMIN" ? "Administrador" : "Operador"}
                </Badge>
              </div>
              <div className="flex justify-between py-1 border-t border-[#E2E8F0]">
                <span className="text-sm text-[#64748B]">Acción</span>
                <Badge variant={
                  detail.action === "LOGIN" || detail.action === "CREATE" ? "success" :
                  detail.action === "LOGIN_FAILED" || detail.action === "DELETE" || detail.action === "ACCOUNT_LOCK" ? "danger" :
                  detail.action === "UPDATE" || detail.action === "PERMISSION_CHANGE" ? "warning" : "info"
                }>
                  {actionLabels[detail.action] || detail.action}
                </Badge>
              </div>
              <div className="flex justify-between py-1 border-t border-[#E2E8F0]">
                <span className="text-sm text-[#64748B]">Módulo</span>
                <span className="text-sm font-medium text-[#1E293B]">{detail.module || "General"}</span>
              </div>
              <div className="flex justify-between py-1 border-t border-[#E2E8F0]">
                <span className="text-sm text-[#64748B]">Entidad</span>
                <span className="text-sm text-[#1E293B]">{detail.entity}</span>
              </div>
              <div className="flex justify-between py-1 border-t border-[#E2E8F0]">
                <span className="text-sm text-[#64748B]">ID Registro</span>
                <span className="text-xs font-mono text-[#94A3B8]">{detail.entityId || "—"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-4">
            <h3 className="text-sm font-semibold text-[#1E293B] flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#64748B]" /> Información Técnica
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between py-1">
                <span className="text-sm text-[#64748B] flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> Fecha
                </span>
                <span className="text-sm font-medium text-[#1E293B]">{formatDate(detail.createdAt)}</span>
              </div>
              <div className="flex justify-between py-1 border-t border-[#E2E8F0]">
                <span className="text-sm text-[#64748B] flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> Hora
                </span>
                <span className="text-sm text-[#1E293B]">
                  {new Date(detail.createdAt).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
              </div>
              <div className="flex justify-between py-1 border-t border-[#E2E8F0]">
                <span className="text-sm text-[#64748B] flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" /> IP
                </span>
                <span className="text-xs font-mono text-[#94A3B8]">{detail.ipAddress || "—"}</span>
              </div>
              <div className="flex justify-between py-1 border-t border-[#E2E8F0]">
                <span className="text-sm text-[#64748B] flex items-center gap-1.5">
                  <Monitor className="h-3.5 w-3.5" /> Navegador
                </span>
                <span className="text-sm text-[#1E293B]">{detail.browser || "—"}</span>
              </div>
              <div className="flex justify-between py-1 border-t border-[#E2E8F0]">
                <span className="text-sm text-[#64748B] flex items-center gap-1.5">
                  <Monitor className="h-3.5 w-3.5" /> Sistema Operativo
                </span>
                <span className="text-sm text-[#1E293B]">{detail.os || "—"}</span>
              </div>
              <div className="flex justify-between py-1 border-t border-[#E2E8F0]">
                <span className="text-sm text-[#64748B] flex items-center gap-1.5">
                  <Smartphone className="h-3.5 w-3.5" /> Dispositivo
                </span>
                <span className="text-sm text-[#1E293B]">{detail.device || "—"}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {detail.changes.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-[#1E293B] flex items-center gap-2 mb-4">
              <FileText className="h-4 w-4 text-[#64748B]" /> Comparación de Cambios
            </h3>
            <div className="space-y-4">
              {detail.changes.map((change, i) => (
                <div key={i} className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="h-3.5 w-3.5 text-[#2563EB]" />
                    <span className="text-sm font-medium text-[#1E293B]">
                      {fieldLabels[change.field] || change.field}
                    </span>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA]">
                      <p className="text-xs font-medium text-[#DC2626] mb-1">VALOR ANTERIOR</p>
                      <p className="text-sm text-[#991B1B]">{change.oldValue}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0]">
                      <p className="text-xs font-medium text-[#16A34A] mb-1">VALOR NUEVO</p>
                      <p className="text-sm text-[#166534]">{change.newValue}</p>
                    </div>
                  </div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-3">
                    <ArrowDown className="h-4 w-4 text-[#94A3B8]" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" /> Volver
        </Button>
        <Button variant="outline" onClick={() => router.push("/auditoria/logs")}>
          Ver todos los eventos
        </Button>
      </div>
    </div>
  )
}
