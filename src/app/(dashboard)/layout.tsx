"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/store/auth"
import { Shell } from "@/components/layout/shell"
import { Loader2 } from "lucide-react"
import toast from "react-hot-toast"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, loading, fetchUser } = useAuth()
  const [changePassword, setChangePassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [changingPwd, setChangingPwd] = useState(false)

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      if (params.get("changePassword") === "true") {
        setChangePassword(true)
      }
    }
  }, [])

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden")
      return
    }
    if (newPassword.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres")
      return
    }

    setChangingPwd(true)
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Error al cambiar contraseña")
        return
      }

      toast.success("Contraseña cambiada exitosamente")
      setChangePassword(false)
      router.push("/dashboard")
    } catch {
      toast.error("Error de conexión")
    } finally {
      setChangingPwd(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#2563EB]" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <Shell>
      {changePassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl border border-[#E2E8F0] p-8 w-full max-w-md mx-4">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-[#F59E0B]/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-[#F59E0B] text-xl font-bold">!</span>
              </div>
              <h2 className="text-lg font-semibold text-[#1E293B]">Cambio de Contraseña Requerido</h2>
              <p className="text-sm text-[#64748B] mt-1">
                Por seguridad, debes cambiar tu contraseña antes de continuar
              </p>
            </div>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">
                  Contraseña Actual
                </label>
                <input
                  type="password"
                  className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">
                  Confirmar Nueva Contraseña
                </label>
                <input
                  type="password"
                  className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <button
                type="submit"
                disabled={changingPwd}
                className="w-full bg-[#2563EB] text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-[#1D4ED8] transition-colors disabled:opacity-50"
              >
                {changingPwd ? "Cambiando..." : "Cambiar Contraseña"}
              </button>
            </form>
          </div>
        </div>
      )}
      {children}
    </Shell>
  )
}
