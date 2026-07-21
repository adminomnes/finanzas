"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Settings, Database, RefreshCw } from "lucide-react"
import toast from "react-hot-toast"

export default function SettingsPage() {
  const handleReseed = async () => {
    try {
      const res = await fetch("/api/auth/seed", { method: "POST" })
      if (res.ok) {
        toast.success("Datos inicializados correctamente")
      } else {
        toast.error("Error al inicializar datos")
      }
    } catch {
      toast.error("Error de conexión")
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-[#F1F5F9]">
          <Settings className="h-5 w-5 text-[#64748B]" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[#1E293B]">Configuración</h2>
          <p className="text-sm text-[#64748B]">
            Parámetros generales del sistema
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-[#EFF6FF]">
                <Database className="h-5 w-5 text-[#2563EB]" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-[#1E293B] mb-1">
                  Datos Iniciales
                </h3>
                <p className="text-xs text-[#64748B] mb-4">
                  Inicializa o restaura los datos por defecto del sistema:
                  categorías, centros de costo, empresa y Super Admin.
                </p>
                <Button variant="outline" size="sm" onClick={handleReseed}>
                  <RefreshCw className="h-4 w-4" />
                  Inicializar Datos
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-[#F0FDF4]">
                <Settings className="h-5 w-5 text-[#22C55E]" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-[#1E293B] mb-1">
                  Información del Sistema
                </h3>
                <div className="space-y-1 text-xs text-[#64748B]">
                  <p>OMNES FINANCE v1.0</p>
                  <p>Omnes Holding SPA</p>
                  <p>Powered by Next.js + PostgreSQL</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
