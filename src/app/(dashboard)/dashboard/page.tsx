"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { KPISkeleton } from "@/components/ui/skeleton"
import { AreaChart } from "@/components/charts/area-chart"
import { PieChart } from "@/components/charts/pie-chart"
import { formatCurrency, formatDateShort } from "@/lib/utils"
import { useAuth } from "@/store/auth"
import type { DashboardStats } from "@/types"
import styles from "./dashboard.module.css"
import {
  TrendingUp, TrendingDown, DollarSign, Clock,
  ArrowUpRight, ArrowDownRight, BarChart3,
  Wallet, Building as BuildingIcon,
} from "lucide-react"

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/dashboard?months=6")
        if (res.ok) setStats(await res.json())
      } catch { console.error("Error fetching dashboard data") }
      finally { setLoading(false) }
    }
    fetchStats()
  }, [])

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Buenos días"
    if (hour < 18) return "Buenas tardes"
    return "Buenas noches"
  }

  if (loading) return (
    <div className={`${styles.container} animate-fade-in`}>
      <KPISkeleton />
      <div className={styles.grid2Col}>
        <Card style={{ height: 320 }}>
          <div className="skeleton h-5 w-40 mb-4" />
          <div className="skeleton h-full w-full" />
        </Card>
        <Card style={{ height: 320 }}>
          <div className="skeleton h-5 w-40 mb-4" />
          <div className="skeleton h-full w-full" />
        </Card>
      </div>
    </div>
  )

  if (!stats) return (
    <EmptyState
      icon={<BarChart3 className="h-8 w-8" />}
      title="Error al cargar datos"
      description="No se pudieron obtener las estadísticas del dashboard. Intente nuevamente."
    />
  )

  const isPositive = stats.netResult >= 0;

  return (
    <div className={`${styles.container} animate-fade-in`}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.greeting}>
            {getGreeting()}, {user?.firstName}
          </h2>
          <p className={styles.subtitle}>
            {user?.lastLogin ? `Último acceso: ${formatDateShort(user.lastLogin)}` : "Bienvenido al sistema financiero."}
          </p>
        </div>
        <div className={styles.companyBadge}>
          <BuildingIcon size={16} />
          <span>Omnes Holding SPA</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className={styles.grid}>
        <Card className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Ingresos Totales</span>
            <div className={`${styles.kpiIconWrapper} ${styles.kpiIconWrapperIncome}`}>
              <TrendingUp size={20} />
            </div>
          </div>
          <p className={styles.kpiValue}>{formatCurrency(stats.totalIncome)}</p>
          <div className={`${styles.kpiTrend} ${styles.trendPos}`}>
            <ArrowUpRight size={16} />
            <span>{stats.incomeCount} registros</span>
          </div>
        </Card>

        <Card className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Gastos Totales</span>
            <div className={`${styles.kpiIconWrapper} ${styles.kpiIconWrapperExpense}`}>
              <TrendingDown size={20} />
            </div>
          </div>
          <p className={styles.kpiValue}>{formatCurrency(stats.totalExpenses)}</p>
          <div className={`${styles.kpiTrend} ${styles.trendNeg}`}>
            <ArrowDownRight size={16} />
            <span>{stats.expenseCount} registros</span>
          </div>
        </Card>

        <Card className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Resultado Neto</span>
            <div className={`${styles.kpiIconWrapper} ${isPositive ? styles.kpiIconWrapperResultPos : styles.kpiIconWrapperResultNeg}`}>
              <DollarSign size={20} />
            </div>
          </div>
          <p className={`${styles.kpiValue} ${isPositive ? styles.kpiValuePos : styles.kpiValueNeg}`}>
            {formatCurrency(Math.abs(stats.netResult))}
          </p>
          <div className={`${styles.kpiTrend} ${isPositive ? styles.trendPos : styles.trendNeg}`}>
            <span>{isPositive ? "Superávit mensual" : "Déficit mensual"}</span>
          </div>
        </Card>

        <Card className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Gastos Pendientes</span>
            <div className={`${styles.kpiIconWrapper} ${styles.kpiIconWrapperPending}`}>
              <Clock size={20} />
            </div>
          </div>
          <p className={styles.kpiValue}>{stats.pendingExpenses}</p>
          <div className={`${styles.kpiTrend} ${styles.trendWarn}`}>
            <span>Pendientes de aprobación</span>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className={styles.grid2Col}>
        <Card>
          <div style={{ padding: "24px 24px 0" }}>
            <h3 className={styles.sectionTitle}>Flujo de Caja</h3>
            <p className={styles.sectionSubtitle}>Ingresos vs Gastos (últimos 6 meses)</p>
          </div>
          <div style={{ padding: "24px" }}>
            <AreaChart
              data={stats.monthlyExpenses.map((m) => ({
                month: m.month as string,
                income: m.income,
                expenses: m.expenses,
              }))}
            />
          </div>
        </Card>

        <Card>
          <div style={{ padding: "24px 24px 0" }}>
            <h3 className={styles.sectionTitle}>Gastos por Categoría</h3>
            <p className={styles.sectionSubtitle}>Distribución (últimos 3 meses)</p>
          </div>
          <div style={{ padding: "24px" }}>
            <PieChart data={stats.expensesByCategory} />
          </div>
        </Card>
      </div>

      {/* Recent Movements */}
      <Card>
        <div style={{ padding: "24px 24px 0" }}>
          <h3 className={styles.sectionTitle}>Últimos Movimientos</h3>
          <p className={styles.sectionSubtitle}>Actividad reciente en el sistema</p>
        </div>
        <div style={{ padding: "24px" }}>
          {stats.recentMovements.length === 0 ? (
            <EmptyState
              icon={<Wallet className="h-8 w-8" />}
              title="Sin movimientos recientes"
              description="No hay actividad financiera registrada en los últimos días."
            />
          ) : (
            <div className={styles.movementList}>
              {stats.recentMovements.map((mov) => {
                const isIncome = mov.type === "INCOME";
                return (
                  <div key={mov.id} className={styles.movementItem}>
                    <div className={styles.movementLeft}>
                      <div className={`${styles.movementIcon} ${isIncome ? styles.kpiIconWrapperIncome : styles.kpiIconWrapperExpense}`}>
                        {isIncome ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                      </div>
                      <div>
                        <p className={styles.movementDesc}>{mov.description}</p>
                        <div className={styles.movementMeta}>
                          <span>{mov.category}</span>
                          <span>&bull;</span>
                          <span>{formatDateShort(mov.date)}</span>
                        </div>
                      </div>
                    </div>
                    <div className={styles.movementRight}>
                      <span className={`${styles.movementAmount} ${isIncome ? styles.kpiValuePos : styles.kpiValueNeg}`}>
                        {isIncome ? "+" : "-"}{formatCurrency(mov.amount)}
                      </span>
                      <Badge 
                        status={
                          mov.status === "APPROVED" || mov.status === "RECEIVED" ? "approved" :
                          mov.status === "PENDING" ? "pending" :
                          mov.status === "REJECTED" ? "rejected" : "default"
                        }
                      >
                        {mov.status === "APPROVED" ? "Aprobado" :
                         mov.status === "RECEIVED" ? "Recibido" :
                         mov.status === "PENDING" ? "Pendiente" :
                         mov.status === "REJECTED" ? "Rechazado" :
                         mov.status === "CANCELLED" ? "Anulado" : mov.status}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
