"use client"

import { useEffect, useRef, useState } from "react"
import { useCompanyStore } from "@/store/company"
import { Building, ChevronDown, Check, Globe } from "lucide-react"
import styles from "./company-selector.module.css"

export function CompanySelector() {
  const { companies, activeCompany, setActiveCompany, holdingView, setHoldingView, fetchCompanies, loading } = useCompanyStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchCompanies()
  }, [fetchCompanies])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  if (loading || companies.length === 0) return null

  return (
    <div ref={ref} className={styles.container}>
      <button
        onClick={() => setOpen(!open)}
        className={styles.trigger}
      >
        {holdingView ? (
          <Globe size={16} color="var(--color-primary)" />
        ) : (
          <Building size={16} color="var(--color-text-muted)" />
        )}
        <span className={styles.triggerText}>
          {holdingView ? "Vista Holding" : activeCompany?.name || "Seleccionar empresa"}
        </span>
        <ChevronDown size={14} color="var(--color-text-muted)" />
      </button>

      {open && (
        <div className={styles.dropdown}>
          <div className={styles.holdingView}>
            <button
              onClick={() => { setHoldingView(!holdingView); setOpen(false) }}
              className={`${styles.option} ${holdingView ? styles.optionActive : ""}`}
            >
              <div className={`${styles.iconWrapper} ${holdingView ? styles.iconWrapperActive : ""}`}>
                <Globe size={16} color={holdingView ? "var(--color-primary)" : "var(--color-text-muted)"} />
              </div>
              <div className={styles.optionInfo}>
                <p className={`${styles.optionTitle} ${holdingView ? styles.optionTitleActive : ""}`}>Vista Consolidada</p>
                <p className={styles.optionSubtitle}>Todas las empresas del Holding</p>
              </div>
              {holdingView && <Check size={16} color="var(--color-primary)" />}
            </button>
          </div>
          <div className={styles.companyList}>
            {companies.map((company) => {
              const isActive = activeCompany?.id === company.id && !holdingView;
              return (
                <button
                  key={company.id}
                  onClick={() => { setActiveCompany(company); setOpen(false) }}
                  className={`${styles.option} ${isActive ? styles.optionActive : ""}`}
                >
                  <div className={`${styles.iconWrapper} ${isActive ? styles.iconWrapperActive : ""}`}>
                    <Building size={16} color={isActive ? "var(--color-primary)" : "var(--color-text-muted)"} />
                  </div>
                  <div className={styles.optionInfo}>
                    <p className={`${styles.optionTitle} ${isActive ? styles.optionTitleActive : ""}`}>{company.name}</p>
                    <p className={styles.optionSubtitle}>{company.rut}</p>
                  </div>
                  {isActive && <Check size={16} color="var(--color-primary)" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
