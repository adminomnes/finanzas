"use client"

import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-6 text-center", className)}>
      {icon && (
        <div className="w-16 h-16 rounded-2xl bg-[#F1F5F9] flex items-center justify-center mb-4 text-[#94A3B8]">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-[#1E293B] mb-1">{title}</h3>
      {description && <p className="text-sm text-[#64748B] max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
