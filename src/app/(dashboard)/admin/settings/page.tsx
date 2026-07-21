"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { useAuth } from "@/store/auth"
import { Settings, Save, Building2, Clock, Shield, Bell } from "lucide-react"
import toast from "react-hot-toast"

interface Setting {
  id: string
  key: string
  value: string
  type: string
  group: string
}

export default function AdminSettingsPage() {
  const { user } = useAuth()
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const defaultSettings = {
    company_name: "Omnes Holding SPA",
    system_name: "OMNES FINANCE",
    system_version: "1.0.0",
    currency: "CLP",
    country: "Chile",
    date_format: "DD/MM/YYYY",
    session_timeout: "480",
    max_login_attempts: "5",
    lock_duration: "15",
    maintenance_mode: "false",
    notifications_enabled: "true",
  }

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/admin/settings")
        if (res.ok) {
          const data = await res.json()
          const map: Record<string, string> = {}
          for (const s of data.data) {
            map[s.key] = s.value
          }
          setSettings({ ...defaultSettings, ...map })
        } else {
          setSettings(defaultSettings)
        }
      } catch {
        setSettings(defaultSettings)
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  const updateField = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
      if (res.ok) {
        toast.success("Configuración guardada correctamente")
      } else {
        const data = await res.json()
        toast.error(data.error || "Error al guardar")
      }
    } catch {
      toast.error("Error de conexión")
    } finally {
      setSaving(false)
    }
  }

  const isSuperAdmin = user?.role === "SUPER_ADMIN"

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-8 w-48 bg-[#F1F5F9] rounded animate-pulse" />
        <div className="grid gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-40 bg-[#F1F5F9] rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#F1F5F9]">
            <Settings className="h-5 w-5 text-[#64748B]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#1E293B]">Configuración General</h2>
            <p className="text-sm text-[#64748B]">Parámetros del sistema</p>
          </div>
        </div>
        {isSuperAdmin && (
          <Button onClick={handleSave} loading={saving}>
            <Save className="h-4 w-4" /> Guardar Cambios
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#2563EB]" />
              <h3 className="text-sm font-semibold text-[#1E293B]">Información del Sistema</h3>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input id="system_name" label="Nombre del Sistema" value={settings.system_name}
              onChange={(e) => updateField("system_name", e.target.value)} disabled={!isSuperAdmin} />
            <Input id="company_name" label="Empresa" value={settings.company_name}
              onChange={(e) => updateField("company_name", e.target.value)} disabled={!isSuperAdmin} />
            <Input id="system_version" label="Versión" value={settings.system_version}
              onChange={(e) => updateField("system_version", e.target.value)} disabled={!isSuperAdmin} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#14B8A6]" />
              <h3 className="text-sm font-semibold text-[#1E293B]">Configuración Financiera</h3>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select id="currency" label="Moneda" value={settings.currency}
              onChange={(e) => updateField("currency", e.target.value)}
              options={[{ value: "CLP", label: "CLP - Peso Chileno" }, { value: "USD", label: "USD - Dólar" }, { value: "EUR", label: "EUR - Euro" }]}
              disabled={!isSuperAdmin} />
            <Select id="country" label="País" value={settings.country}
              onChange={(e) => updateField("country", e.target.value)}
              options={[{ value: "Chile", label: "Chile" }, { value: "Argentina", label: "Argentina" }, { value: "Peru", label: "Perú" }, { value: "Colombia", label: "Colombia" }]}
              disabled={!isSuperAdmin} />
            <Select id="date_format" label="Formato de Fecha" value={settings.date_format}
              onChange={(e) => updateField("date_format", e.target.value)}
              options={[{ value: "DD/MM/YYYY", label: "DD/MM/YYYY" }, { value: "MM/DD/YYYY", label: "MM/DD/YYYY" }, { value: "YYYY-MM-DD", label: "YYYY-MM-DD" }]}
              disabled={!isSuperAdmin} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#EF4444]" />
              <h3 className="text-sm font-semibold text-[#1E293B]">Seguridad</h3>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input id="session_timeout" label="Tiempo de Sesión (minutos)" type="number" value={settings.session_timeout}
              onChange={(e) => updateField("session_timeout", e.target.value)} disabled={!isSuperAdmin} />
            <Input id="max_login_attempts" label="Intentos máximos de login" type="number" value={settings.max_login_attempts}
              onChange={(e) => updateField("max_login_attempts", e.target.value)} disabled={!isSuperAdmin} />
            <Input id="lock_duration" label="Bloqueo temporal (minutos)" type="number" value={settings.lock_duration}
              onChange={(e) => updateField("lock_duration", e.target.value)} disabled={!isSuperAdmin} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-[#F59E0B]" />
              <h3 className="text-sm font-semibold text-[#1E293B]">Sistema</h3>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select id="maintenance_mode" label="Modo Mantenimiento" value={settings.maintenance_mode}
              onChange={(e) => updateField("maintenance_mode", e.target.value)}
              options={[{ value: "false", label: "Desactivado" }, { value: "true", label: "Activado" }]}
              disabled={!isSuperAdmin} />
            <Select id="notifications_enabled" label="Notificaciones" value={settings.notifications_enabled}
              onChange={(e) => updateField("notifications_enabled", e.target.value)}
              options={[{ value: "true", label: "Activadas" }, { value: "false", label: "Desactivadas" }]}
              disabled={!isSuperAdmin} />
            <div className="pt-2 text-xs text-[#94A3B8]">
              <p>Última actualización: {new Date().toLocaleDateString("es-CL")}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {!isSuperAdmin && (
        <Card>
          <CardContent className="p-4 text-center text-sm text-[#94A3B8]">
            Solo el Super Administrador puede modificar la configuración del sistema.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
