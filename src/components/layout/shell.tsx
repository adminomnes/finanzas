"use client"

import React, { useState, useEffect } from "react"
import { Sidebar } from "./sidebar"
import { Header } from "./header"
import styles from "./shell.module.css"

interface ShellProps {
  children: React.ReactNode
}

export function Shell({ children }: ShellProps) {
  const [collapsed, setCollapsed] = useState(false)

  // Load state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem("sidebarCollapsed")
    if (savedState !== null) {
      setCollapsed(JSON.parse(savedState))
    }
  }, [])

  const handleToggle = () => {
    const newState = !collapsed
    setCollapsed(newState)
    localStorage.setItem("sidebarCollapsed", JSON.stringify(newState))
  }

  return (
    <div className={styles.layout}>
      <Sidebar collapsed={collapsed} onToggle={handleToggle} />
      <main className={`${styles.main} ${collapsed ? styles.mainCollapsed : styles.mainExpanded}`}>
        <Header />
        <div className={styles.content}>
          {children}
        </div>
      </main>
    </div>
  )
}
