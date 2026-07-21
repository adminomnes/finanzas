"use client"

import { useState, useRef, useEffect, type ReactNode } from "react"
import styles from "./dropdown.module.css"

interface DropdownItem {
  label: string
  icon?: ReactNode
  onClick: () => void
  variant?: "default" | "danger"
  divider?: boolean
}

interface DropdownProps {
  trigger: ReactNode
  items: DropdownItem[]
  align?: "left" | "right"
  className?: string
}

export function Dropdown({ trigger, items, align = "right", className = "" }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <div ref={ref} className={`${styles.container} ${className}`.trim()}>
      <div onClick={() => setOpen(!open)} className={styles.trigger}>
        {trigger}
      </div>
      {open && (
        <div className={`${styles.dropdown} ${align === "right" ? styles.alignRight : styles.alignLeft}`}>
          {items.map((item, i) => (
            <div key={i}>
              {item.divider && <div className={styles.divider} />}
              {item.label && (
                <button
                  onClick={() => { item.onClick(); setOpen(false) }}
                  className={`${styles.item} ${item.variant === "danger" ? styles.itemDanger : styles.itemDefault}`}
                >
                  {item.icon}
                  {item.label}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
