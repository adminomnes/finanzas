export interface UserSession {
  id: string
  email: string
  firstName: string
  lastName: string
  role: "SUPER_ADMIN" | "ADMIN" | "OPERATOR"
  permissions: string[]
  isActive: boolean
  mustChangePwd: boolean
  lastLogin: Date | null
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ExpenseFormData {
  date: string
  companyId: string
  supplierId: string
  documentType: string
  documentNumber: string
  categoryId: string
  costCenterId: string
  description: string
  netAmount: number
  taxAmount: number
  totalAmount: number
  paymentMethod: string
  responsibleId: string
  notes?: string
}

export interface IncomeFormData {
  date: string
  companyId: string
  categoryId: string
  description: string
  netAmount: number
  taxAmount: number
  totalAmount: number
  paymentMethod: string
  notes?: string
}

export interface DashboardStats {
  totalIncome: number
  totalExpenses: number
  netResult: number
  cashFlow: number
  incomeCount: number
  expenseCount: number
  pendingExpenses: number
  monthlyExpenses: { month: string; income: number; expenses: number }[]
  expensesByCategory: { category: string; amount: number; color: string }[]
  recentMovements: RecentMovement[]
}

export interface RecentMovement {
  id: string
  date: Date
  type: "EXPENSE" | "INCOME"
  description: string
  amount: number
  category: string
  status: string
}
