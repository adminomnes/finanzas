"use client"

import { cn } from "@/lib/utils"

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn("skeleton", className)} />
}

export function KPISkeleton() {
  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-[#E2E8F0] p-5">
          <div className="skeleton h-4 w-24 mb-3" />
          <div className="skeleton h-8 w-32 mb-3" />
          <div className="skeleton h-3 w-20" />
        </div>
      ))}
    </div>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
      <div className="p-4 border-b border-[#E2E8F0]">
        <div className="skeleton h-4 w-full" />
      </div>
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="p-4 border-b border-[#E2E8F0] last:border-0">
          <div className="skeleton h-4 w-full" style={{ width: `${80 + Math.random() * 20}%` }} />
        </div>
      ))}
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
      <div className="skeleton h-5 w-40 mb-4" />
      <div className="skeleton h-4 w-full mb-2" />
      <div className="skeleton h-4 w-3/4" />
    </div>
  )
}
