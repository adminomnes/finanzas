"use client"

import React, { useEffect } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import styles from "./modal.module.css"

export interface ModalProps {
  isOpen?: boolean
  open?: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  children: React.ReactNode
  footer?: React.ReactNode
  maxWidth?: string
  size?: "sm" | "md" | "lg" | "xl"
}

export function Modal({ isOpen, open, onClose, title, subtitle, children, footer, maxWidth, size }: ModalProps) {
  const isVisible = isOpen ?? open ?? false

  const sizeToMaxWidth: Record<string, string> = {
    sm: "400px",
    md: "560px",
    lg: "720px",
    xl: "900px",
  }
  const resolvedMaxWidth = maxWidth || (size ? sizeToMaxWidth[size] : undefined)

  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isVisible])

  if (!isVisible) return null

  const modalContent = (
    <div className={styles.overlay} onClick={onClose}>
      <div 
        className={styles.modal} 
        onClick={(e) => e.stopPropagation()}
        style={resolvedMaxWidth ? { maxWidth: resolvedMaxWidth } : undefined}
      >
        {(title || subtitle) && (
          <div className={styles.header}>
            <div>
              <h2 className={styles.title}>{title}</h2>
              {subtitle && <p className="text-sm text-[#64748B] mt-1">{subtitle}</p>}
            </div>
            <button className={styles.closeButton} onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        )}
        <div className={styles.content}>
          {children}
        </div>
        {footer && (
          <div className={styles.footer}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )

  if (typeof window === "undefined") return null

  return createPortal(modalContent, document.body)
}
