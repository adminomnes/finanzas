"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/store/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import toast from "react-hot-toast"
import { Loader2, Eye, EyeOff, Shield, Building, ChevronRight } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const { user, loading, fetchUser } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSeeding, setIsSeeding] = useState(false)
  const [focused, setFocused] = useState<"email" | "password" | null>(null)

  useEffect(() => {
    if (!loading && user) {
      router.push(user.mustChangePwd ? "/dashboard?changePassword=true" : "/dashboard")
    }
  }, [user, loading, router])

  useEffect(() => {
    fetchUser().then(() => {
      const seedIfNeeded = async () => {
        try {
          const res = await fetch("/api/auth/me")
          if (!res.ok) { setIsSeeding(true); await fetch("/api/auth/seed", { method: "POST" }); setIsSeeding(false) }
        } catch { /* skip */ }
      }
      seedIfNeeded()
    })
  }, [fetchUser])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { toast.error("Ingrese email y contraseña"); return }
    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(
          res.status === 429 ? "Demasiados intentos. Espere unos minutos." :
          res.status === 423 ? "Cuenta bloqueada temporalmente" :
          data.error || "Error al iniciar sesión"
        )
        return
      }
      await fetchUser()
      toast.success("Inicio de sesión exitoso")
      setTimeout(() => router.push(data.mustChangePwd ? "/dashboard?changePassword=true" : "/dashboard"), 200)
    } catch { toast.error("Error de conexión") }
    finally { setIsLoading(false) }
  }

  if (loading || isSeeding) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#2563EB]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex">
      {/* Left Panel - Brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#1E3A5F] via-[#2563EB] to-[#1E40AF] relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-black/10 to-transparent" />
        <div className="relative flex flex-col justify-center px-16 w-full">
          <div className="animate-fade-in-up">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mb-6 border border-white/10 shadow-xl">
              <span className="text-white font-bold text-2xl tracking-tight">OF</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">OMNES FINANCE</h1>
            <p className="text-lg text-blue-200/80 font-light">Sistema Contable y Financiero Empresarial</p>
            <div className="mt-6 flex items-center gap-2">
              <div className="h-px w-12 bg-blue-400/40" />
              <span className="text-xs text-blue-300/60 font-medium tracking-widest uppercase">Omnes Holding SPA</span>
            </div>
          </div>

          <div className="mt-12 space-y-4 animate-fade-in-d-3">
            <div className="backdrop-blur-sm bg-white/5 rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl bg-white/10">
                  <Shield className="h-5 w-5 text-blue-300" />
                </div>
                <span className="text-sm font-semibold text-white">Plataforma Segura</span>
              </div>
              <p className="text-blue-100/70 text-sm leading-relaxed font-light">
                Gestión financiera enterprise con autenticación multifactor, auditoría completa y control de acceso granular.
              </p>
            </div>
            <div className="flex gap-3">
              {["ERP Modular", "Auditoría Total", "Cifrado SSL"].map((tag) => (
                <span key={tag} className="px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-blue-200/70 font-medium">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          {/* Logo mobile */}
          <div className="lg:hidden text-center mb-8 animate-fade-in-up">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#2563EB]/20">
              <span className="text-white font-bold text-xl">OF</span>
            </div>
            <h2 className="text-xl font-bold text-[#111827] tracking-tight">OMNES FINANCE</h2>
            <p className="text-sm text-[#64748B] mt-1">Sistema Contable y Financiero</p>
          </div>

          <div className="animate-fade-in-up">
            <div className="hidden lg:block mb-8">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] flex items-center justify-center mb-4 shadow-lg shadow-[#2563EB]/20">
                <span className="text-white font-bold text-lg">OF</span>
              </div>
              <h2 className="text-2xl font-bold text-[#111827] tracking-tight">Acceder al Sistema</h2>
              <p className="text-sm text-[#64748B] mt-1">Ingrese sus credenciales para continuar</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="animate-fade-in-d-1">
                <Input
                  id="email"
                  label="Correo Electrónico"
                  type="email"
                  placeholder="nombre@omnesholding.cl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused(null)}
                  autoComplete="email"
                  icon={<Building className="h-4 w-4" />}
                />
              </div>

              <div className="animate-fade-in-d-2">
                <div className="relative">
                  <Input
                    id="password"
                    label="Contraseña"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocused("password")}
                    onBlur={() => setFocused(null)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-[38px] text-[#94A3B8] hover:text-[#64748B] transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between animate-fade-in-d-3">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="w-4 h-4 rounded border border-[#CBD5E1] bg-white peer-checked:bg-[#2563EB] peer-checked:border-[#2563EB] transition-all duration-200" />
                    <svg className="absolute top-[2px] left-[2px] w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="text-xs text-[#64748B] group-hover:text-[#1E293B] transition-colors">Recordar sesión</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-medium transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              <div className="animate-fade-in-d-4">
                <Button type="submit" className="w-full h-[44px]" isLoading={isLoading}>
                  <span>Ingresar</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>

          <p className="text-center text-xs text-[#94A3B8] mt-8 animate-fade-in-d-5">
            OMNES FINANCE v1.0 &copy; {new Date().getFullYear()} Omnes Holding SPA
          </p>
        </div>
      </div>
    </div>
  )
}
