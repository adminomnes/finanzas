"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  LogIn, LogOut, ShieldAlert, AlertTriangle, Search,
  CheckCircle, XCircle, Lock,
} from "lucide-react"
import { formatDate } from "@/lib/utils"

interface AccessEntry {
  id: string
  email: string
  ipAddress: string | null
  userAgent: string | null
  success: boolean
  createdAt: string
  user: { id: string; firstName: string; lastName: string; email: string } | null
}

interface Summary {
  totalSuccess: number
  totalFailed: number
  totalBlocked: number
}

export default function AccessLogsPage() {
  const [attempts, setAttempts] = useState<AccessEntry[]>([])
  const [summary, setSummary] = useState<Summary>({ totalSuccess: 0, totalFailed: 0, totalBlocked: 0 })
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [successFilter, setSuccessFilter] = useState("")
  const [emailSearch, setEmailSearch] = useState("")
  const limit = 30

  const fetchAttempts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (successFilter) params.set("success", successFilter)
      if (emailSearch) params.set("email", emailSearch)

      const res = await fetch(`/api/auditoria/accesos?${params}`)
      if (res.ok) {
        const d = await res.json()
        setAttempts(d.data)
        setTotal(d.total)
        setTotalPages(d.totalPages)
        setSummary(d.summary)
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [page, successFilter, emailSearch])

  useEffect(() => { fetchAttempts() }, [fetchAttempts])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-[#FEF2F2]">
          <ShieldAlert className="h-5 w-5 text-[#DC2626]" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[#1E293B]">Logs de Acceso</h2>
          <p className="text-sm text-[#64748B]">{total} intentos de acceso registrados</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#F0FDF4]"><CheckCircle className="h-5 w-5 text-[#16A34A]" /></div>
            <div>
              <p className="text-xs text-[#64748B]">Accesos Exitosos</p>
              <p className="text-xl font-bold text-[#1E293B]">{summary.totalSuccess}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#FEF2F2]"><XCircle className="h-5 w-5 text-[#DC2626]" /></div>
            <div>
              <p className="text-xs text-[#64748B]">Intentos Fallidos</p>
              <p className="text-xl font-bold text-[#1E293B]">{summary.totalFailed}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#FFFBEB]"><Lock className="h-5 w-5 text-[#F59E0B]" /></div>
            <div>
              <p className="text-xs text-[#64748B]">Cuentas Bloqueadas</p>
              <p className="text-xl font-bold text-[#1E293B]">{summary.totalBlocked}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 relative min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
              <input type="text" placeholder="Buscar por email..." className="w-full pl-9 pr-4 py-2 rounded-lg border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                value={emailSearch} onChange={(e) => { setEmailSearch(e.target.value); setPage(1) }} />
            </div>
            <select className="px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#64748B]"
              value={successFilter} onChange={(e) => { setSuccessFilter(e.target.value); setPage(1) }}>
              <option value="">Todos los estados</option>
              <option value="true">Exitoso</option>
              <option value="false">Fallido</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-[#94A3B8]">Cargando...</div>
          ) : attempts.length === 0 ? (
            <div className="p-12 text-center">
              <ShieldAlert className="h-12 w-12 text-[#E2E8F0] mx-auto mb-3" />
              <p className="text-[#64748B]">No se encontraron intentos de acceso</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E2E8F0]">
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase">Usuario</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase">Resultado</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase">IP</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase">Fecha/Hora</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {attempts.map((a) => (
                    <tr key={a.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-4 py-3 text-sm text-[#1E293B]">
                        {a.user ? `${a.user.firstName} ${a.user.lastName}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#64748B]">{a.email}</td>
                      <td className="px-4 py-3">
                        {a.success ? (
                          <Badge variant="success"><LogIn className="h-3 w-3 mr-1" /> LOGIN EXITOSO</Badge>
                        ) : (
                          <Badge variant="danger"><XCircle className="h-3 w-3 mr-1" /> LOGIN FALLIDO</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#64748B] font-mono">{a.ipAddress || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-[#1E293B]">{formatDate(a.createdAt)}</div>
                        <div className="text-xs text-[#94A3B8]">
                          {new Date(a.createdAt).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#E2E8F0]">
              <span className="text-sm text-[#64748B]">
                Mostrando {(page - 1) * limit + 1}-{Math.min(page * limit, total)} de {total}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Siguiente</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
