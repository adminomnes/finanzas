import React from "react"
import { DevelopmentTabs } from "./_components/tabs"

export default function DevelopmentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Centro de Desarrollo</h1>
          <p className="text-[#64748B]">Gestión del ciclo de vida de OMNES FINANCE</p>
        </div>
        <DevelopmentTabs />
      </div>

      <div className="pt-2">
        {children}
      </div>
    </div>
  )
}
