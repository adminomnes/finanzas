"use client"

import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface PieChartProps {
  data: { category: string; amount: number; color: string }[]
}

export function PieChart({ data }: PieChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-[280px] flex items-center justify-center text-sm text-[#94A3B8]">
        Sin datos disponibles
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={3}
          dataKey="amount"
          nameKey="category"
        >
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: "#fff",
            border: "1px solid #E2E8F0",
            borderRadius: "8px",
            fontSize: "13px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          }}
          formatter={(value, name) => [
            `$${(value as number).toLocaleString("es-CL")}`,
            name,
          ]}
        />
      </RechartsPieChart>
    </ResponsiveContainer>
  )
}
