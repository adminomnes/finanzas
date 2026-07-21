"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Terminal, Map, ListTree, History, Lightbulb } from "lucide-react"

const tabs = [
  { name: "Dashboard", href: "/admin/development", icon: Terminal },
  { name: "Roadmap", href: "/admin/development/roadmap", icon: Map },
  { name: "Versiones", href: "/admin/development/versions", icon: ListTree },
  { name: "Changelog", href: "/admin/development/changelog", icon: History },
  { name: "Backlog", href: "/admin/development/backlog", icon: Lightbulb },
]

export function DevelopmentTabs() {
  const pathname = usePathname()

  return (
    <div className="flex bg-[#F1F5F9] p-1 rounded-xl">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = pathname === tab.href
        return (
          <Link
            key={tab.name}
            href={tab.href}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              isActive
                ? "bg-white text-[#2563EB] shadow-sm"
                : "text-[#64748B] hover:text-[#1E293B]"
            }`}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{tab.name}</span>
          </Link>
        )
      })}
    </div>
  )
}
