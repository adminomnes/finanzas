"use client"

import { Suspense, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Eye, EyeOff, KeyRound, CheckCircle2, AlertCircle } from "lucide-react"
import toast from "react-hot-toast"

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!token) {
      setError("Enlace inválido. No se encontró el token de recuperación.")
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) { toast.error("Token inválido"); return }
    if (password !== confirmPassword) { toast.error("Las contraseñas no coinciden"); return }
    if (password.length < 8) { toast.error("La contraseña debe tener al menos 8 caracteres"); return }

    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || "Error"); return }
      setSuccess(true)
      toast.success("Contraseña restablecida")
      setTimeout(() => router.push("/login"), 3000)
    } catch {
      toast.error("Error de conexión")
    } finally {
      setIsLoading(false)
    }
  }

  if (!token && !success) {
    return (
      <div className="w-full max-w-sm mx-auto text-center">
        <Card className="shadow-lg border-[#E2E8F0]">
          <CardContent className="p-8">
            <div className="w-16 h-16 rounded-full bg-[#FEF2F2] flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-[#EF4444]" />
            </div>
            <h2 className="text-lg font-semibold text-[#1E293B] mb-2">Enlace Inválido</h2>
            <p className="text-sm text-[#64748B] mb-6">{error || "El enlace no es válido o ha expirado."}</p>
            <Link href="/forgot-password" className="text-sm text-[#2563EB] hover:text-[#1D4ED8] font-medium">
              Solicitar nuevo enlace
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-xl bg-[#2563EB] flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-xl">OF</span>
        </div>
        <h2 className="text-xl font-semibold text-[#1E293B]">
          {success ? "Contraseña Actualizada" : "Nueva Contraseña"}
        </h2>
        <p className="text-sm text-[#64748B] mt-1">
          {success ? "Serás redirigido al inicio de sesión..." : "Ingresa tu nueva contraseña"}
        </p>
      </div>

      <Card className="shadow-lg border-[#E2E8F0]">
        <CardContent className="p-6">
          {success ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#F0FDF4] flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8 text-[#22C55E]" />
              </div>
              <Link href="/login" className="inline-flex items-center gap-2 text-sm text-[#2563EB] hover:text-[#1D4ED8] font-medium">
                Ir al inicio de sesión
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Input id="password" label="Nueva Contraseña" type={showPassword ? "text" : "password"}
                  placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[38px] text-[#94A3B8] hover:text-[#64748B]">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Input id="confirmPassword" label="Confirmar Contraseña" type={showPassword ? "text" : "password"}
                placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" />
              <div className="text-xs text-[#94A3B8] space-y-1">
                <p>La contraseña debe tener:</p>
                <ul className="list-disc list-inside">
                  <li>Mínimo 8 caracteres</li>
                  <li>Al menos una mayúscula</li>
                  <li>Al menos una minúscula</li>
                  <li>Al menos un número</li>
                  <li>Al menos un carácter especial</li>
                </ul>
              </div>
              <Button type="submit" className="w-full" loading={isLoading}>
                <KeyRound className="h-4 w-4" /> Restablecer Contraseña
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center px-6">
      <Suspense fallback={
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <ResetPasswordForm />
      </Suspense>
    </div>
  )
}
