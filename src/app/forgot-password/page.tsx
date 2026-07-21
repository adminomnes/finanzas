"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react"
import toast from "react-hot-toast"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast.error("Ingrese su correo electrónico")
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Error al procesar solicitud")
        return
      }

      setSent(true)
    } catch {
      toast.error("Error de conexión")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center px-6">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#2563EB] flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">OF</span>
          </div>
          <h2 className="text-xl font-semibold text-[#1E293B]">
            {sent ? "Revisa tu correo" : "Recuperar Contraseña"}
          </h2>
          <p className="text-sm text-[#64748B] mt-1">
            {sent
              ? "Hemos enviado las instrucciones a tu correo si está registrado."
              : "Ingresa tu correo y te enviaremos instrucciones"}
          </p>
        </div>

        <Card className="shadow-lg border-[#E2E8F0]">
          <CardContent className="p-6">
            {sent ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#F0FDF4] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-8 w-8 text-[#22C55E]" />
                </div>
                <p className="text-sm text-[#64748B]">
                  Si el correo <strong className="text-[#1E293B]">{email}</strong> está
                  registrado, recibirás un enlace para restablecer tu contraseña.
                </p>
                <p className="text-xs text-[#94A3B8]">
                  El enlace expirará en 1 hora.
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm text-[#2563EB] hover:text-[#1D4ED8] font-medium"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver al inicio de sesión
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  id="email"
                  label="Correo Electrónico"
                  type="email"
                  placeholder="tu@correo.cl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
                <Button type="submit" className="w-full" loading={isLoading}>
                  <Mail className="h-4 w-4" />
                  Enviar Instrucciones
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {!sent && (
          <p className="text-center mt-6">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm text-[#2563EB] hover:text-[#1D4ED8] font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio de sesión
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
