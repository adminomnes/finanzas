"use client"

import { create } from "zustand"

export interface CompanyOption {
  id: string
  name: string
  rut: string
  businessName: string | null
  fantasyName: string | null
  logo: string | null
  currency: string
  isActive: boolean
}

interface CompanyState {
  companies: CompanyOption[]
  activeCompany: CompanyOption | null
  loading: boolean
  holdingView: boolean
  setActiveCompany: (company: CompanyOption | null) => void
  setCompanies: (companies: CompanyOption[]) => void
  setLoading: (loading: boolean) => void
  setHoldingView: (view: boolean) => void
  fetchCompanies: () => Promise<void>
}

export const useCompanyStore = create<CompanyState>((set, get) => ({
  companies: [],
  activeCompany: null,
  loading: true,
  holdingView: false,
  setActiveCompany: (company) => {
    set({ activeCompany: company, holdingView: false })
    if (typeof window !== "undefined") {
      if (company) localStorage.setItem("activeCompanyId", company.id)
      else localStorage.removeItem("activeCompanyId")
    }
  },
  setCompanies: (companies) => set({ companies }),
  setLoading: (loading) => set({ loading }),
  setHoldingView: (view) => set({ holdingView: view, activeCompany: view ? null : get().activeCompany }),
  fetchCompanies: async () => {
    try {
      set({ loading: true })
      const res = await fetch("/api/companies")
      if (res.ok) {
        const data = await res.json()
        const companies = data.data || data
        set({ companies })

        const savedId = localStorage.getItem("activeCompanyId")
        if (savedId) {
          const saved = companies.find((c: CompanyOption) => c.id === savedId)
          if (saved) set({ activeCompany: saved })
        }
        if (!get().activeCompany && companies.length > 0) {
          set({ activeCompany: companies[0] })
        }
      }
    } catch {
      // silent
    } finally {
      set({ loading: false })
    }
  },
}))
