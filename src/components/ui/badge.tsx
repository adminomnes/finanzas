import React from "react"
import styles from "./badge.module.css"
import { Clock, CheckCircle2, XCircle, CreditCard, Activity, MinusCircle } from "lucide-react"

export type BadgeStatus = "pending" | "approved" | "rejected" | "paid" | "active" | "inactive" | "default"
export type BadgeVariant = "default" | "success" | "danger" | "warning" | "info"

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: BadgeStatus
  variant?: BadgeVariant
  showIcon?: boolean
  size?: "sm" | "md" | "lg"
}

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  default: { backgroundColor: "#F1F5F9", color: "#64748B" },
  success: { backgroundColor: "#DCFCE7", color: "#15803D" },
  danger:  { backgroundColor: "#FEE2E2", color: "#B91C1C" },
  warning: { backgroundColor: "#FEF3C7", color: "#B45309" },
  info:    { backgroundColor: "#DBEAFE", color: "#1D4ED8" },
}

export function Badge({ 
  className = "", 
  status = "default",
  variant,
  showIcon = true,
  children, 
  style,
  ...props 
}: BadgeProps) {
  
  const getIcon = () => {
    if (!showIcon || variant) return null;
    switch (status) {
      case "pending": return <Clock className={styles.icon} />
      case "approved": return <CheckCircle2 className={styles.icon} />
      case "rejected": return <XCircle className={styles.icon} />
      case "paid": return <CreditCard className={styles.icon} />
      case "active": return <Activity className={styles.icon} />
      case "inactive": return <MinusCircle className={styles.icon} />
      default: return null
    }
  }

  const variantStyle = variant ? variantStyles[variant] : undefined

  return (
    <span 
      className={`${styles.badge} ${!variant ? styles[`status-${status}`] : ""} ${className}`.trim()} 
      style={variantStyle ? { ...variantStyle, ...style } : style}
      {...props}
    >
      {getIcon()}
      {children}
    </span>
  )
}
