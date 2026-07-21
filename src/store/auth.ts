"use client"

import { create } from "zustand"
import type { UserSession } from "@/types"

interface AuthState {
  user: UserSession | null
  loading: boolean
  setUser: (user: UserSession | null) => void
  setLoading: (loading: boolean) => void
  fetchUser: () => Promise<void>
  logout: () => Promise<void>
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  fetchUser: async () => {
    try {
      const res = await fetch("/api/auth/me")
      if (res.ok) {
        const data = await res.json()
        set({ user: data.user, loading: false })
      } else {
        set({ user: null, loading: false })
        if (window.location.pathname !== "/login") {
          window.location.href = "/login"
        }
      }
    } catch {
      set({ user: null, loading: false })
    }
  },
  logout: async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    set({ user: null })
  },
}))
