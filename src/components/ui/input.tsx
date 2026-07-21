import React from "react"
import styles from "./input.module.css"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helpText?: string
  hint?: string
  icon?: React.ReactNode
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className = "",
      label,
      error,
      helpText,
      hint,
      icon,
      leftIcon,
      rightIcon,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || React.useId()

    const inputClasses = [
      styles.input,
      error ? styles.inputError : "",
      leftIcon ? styles.withIconLeft : "",
      rightIcon ? styles.withIconRight : "",
      className
    ].filter(Boolean).join(" ")

    return (
      <div className={styles.container}>
        {label && (
          <label htmlFor={inputId} className={styles.label}>
            {label}
          </label>
        )}
        <div className={styles.inputWrapper}>
          {leftIcon || icon ? <span className={styles.iconLeft}>{leftIcon || icon}</span> : null}
          <input
            id={inputId}
            ref={ref}
            className={inputClasses}
            {...props}
          />
          {rightIcon && <span className={styles.iconRight}>{rightIcon}</span>}
        </div>
        {(error || helpText || hint) && (
          <p className={`${styles.message} ${error ? styles.errorMessage : ""}`}>
            {error || helpText || hint}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = "Input"
