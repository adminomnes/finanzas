"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Terminal, CheckCircle2, CircleDashed, Rocket, Activity, Bug } from "lucide-react"

export default function DevelopmentDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/development/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data.data)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <div className="p-12 text-center text-[#94A3B8]">Cargando métricas...</div>
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        
        {/* Version Actual */}
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-[#64748B] mb-1">Versión Actual</p>
                <h3 className="text-2xl font-bold text-[#1E293B]">{stats?.currentVersion}</h3>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Rocket className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-[#64748B]">
              <span className="flex items-center gap-1 text-green-600 font-medium">
                <Activity className="h-4 w-4" />
                {stats?.status}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Modulos Implementados */}
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-[#64748B] mb-1">Módulos Implementados</p>
                <h3 className="text-2xl font-bold text-[#1E293B]">{stats?.completedModules}</h3>
              </div>
              <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 text-sm text-[#64748B]">
              De {stats?.totalModules} módulos planificados
            </div>
          </CardContent>
        </Card>

        {/* Modulos Pendientes */}
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-[#64748B] mb-1">Módulos Pendientes</p>
                <h3 className="text-2xl font-bold text-[#1E293B]">{stats?.pendingModules}</h3>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <CircleDashed className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 text-sm text-[#64748B]">
              En desarrollo o backlog
            </div>
          </CardContent>
        </Card>

        {/* Incidencias Abiertas */}
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-[#64748B] mb-1">Incidencias Abiertas</p>
                <h3 className="text-2xl font-bold text-[#1E293B]">{stats?.openIssues}</h3>
              </div>
              <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                <Bug className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 text-sm text-[#64748B]">
              Tareas marcadas como Pendientes
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-[#1E293B] mb-4">Progreso General del ERP</h3>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-[#64748B]">Avance de la versión</span>
              <span className="font-bold text-[#2563EB]">{stats?.progress}%</span>
            </div>
            <div className="h-4 w-full bg-[#E2E8F0] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#2563EB] rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${stats?.progress || 0}%` }}
              />
            </div>
            <div className="text-xs text-[#94A3B8] text-right">
              Última actualización: {stats?.lastUpdate ? new Date(stats?.lastUpdate).toLocaleDateString('es-CL') : 'N/A'}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


