"use client"

import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface AreaChartProps {
  data: { month: string; income: number; expenses: number }[]
}

export function AreaChart({ data }: AreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <RechartsAreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22C55E" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
        <XAxis
          dataKey="month"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#94A3B8", fontSize: 12 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#94A3B8", fontSize: 12 }}
          tickFormatter={(value: number) =>
            value >= 1000000
              ? `$${(value / 1000000).toFixed(0)}M`
              : value >= 1000
              ? `$${(value / 1000).toFixed(0)}K`
              : `$${value}`
          }
        />
        <Tooltip
          contentStyle={{
            background: "#fff",
            border: "1px solid #E2E8F0",
            borderRadius: "8px",
            fontSize: "13px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          }}
          formatter={(value) => [
            `$${(value as number).toLocaleString("es-CL")}`,
          ]}
        />
        <Area
          type="monotone"
          dataKey="income"
          stroke="#22C55E"
          strokeWidth={2}
          fill="url(#incomeGrad)"
          name="Ingresos"
        />
        <Area
          type="monotone"
          dataKey="expenses"
          stroke="#EF4444"
          strokeWidth={2}
          fill="url(#expenseGrad)"
          name="Gastos"
        />
      </RechartsAreaChart>
    </ResponsiveContainer>
  )
}
