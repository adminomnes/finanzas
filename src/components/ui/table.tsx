import React from "react"
import styles from "./table.module.css"

export function Table({ className = "", children, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className={styles.container}>
      <table className={`${styles.table} ${className}`.trim()} {...props}>
        {children}
      </table>
    </div>
  )
}

export function TableHeader({ className = "", children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={`${styles.thead} ${className}`.trim()} {...props}>
      {children}
    </thead>
  )
}

export function TableBody({ className = "", children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={`${styles.tbody} ${className}`.trim()} {...props}>
      {children}
    </tbody>
  )
}

export function TableRow({ className = "", children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={`${styles.tr} ${className}`.trim()} {...props}>
      {children}
    </tr>
  )
}

export function TableHead({ className = "", children, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={`${styles.th} ${className}`.trim()} {...props}>
      {children}
    </th>
  )
}

export function TableCell({ className = "", children, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={`${styles.td} ${className}`.trim()} {...props}>
      {children}
    </td>
  )
}
