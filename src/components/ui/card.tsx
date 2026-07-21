import React from "react"
import styles from "./card.module.css"

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function Card({ className = "", children, ...props }: CardProps) {
  return (
    <div className={`${styles.card} ${className}`.trim()} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({ className = "", children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`${styles.header} ${className}`.trim()} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ className = "", children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={`${styles.title} ${className}`.trim()} {...props}>
      {children}
    </h3>
  )
}

export function CardDescription({ className = "", children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`${styles.description} ${className}`.trim()} {...props}>
      {children}
    </p>
  )
}

export function CardContent({ className = "", children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`${styles.content} ${className}`.trim()} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ className = "", children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`${styles.footer} ${className}`.trim()} {...props}>
      {children}
    </div>
  )
}
