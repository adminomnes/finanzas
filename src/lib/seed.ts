import { prisma } from "./prisma"
import { hashPassword } from "./auth"
import { seedPermissions } from "./permissions"

export async function seedSuperAdmin() {
  const email = process.env.SUPER_ADMIN_EMAIL
  const password = process.env.SUPER_ADMIN_PASSWORD
  const firstName = process.env.SUPER_ADMIN_FIRST_NAME
  const lastName = process.env.SUPER_ADMIN_LAST_NAME

  if (!email || !password || !firstName || !lastName) {
    console.warn("Super Admin environment variables not configured")
    return
  }

  const existingSuperAdmin = await prisma.user.findFirst({
    where: { role: "SUPER_ADMIN" },
  })

  if (existingSuperAdmin) {
    console.log("Super Admin already exists, skipping seed")
    return
  }

  const passwordHash = await hashPassword(password)

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName,
      lastName,
      role: "SUPER_ADMIN",
      mustChangePwd: true,
    },
  })

  console.log(`Super Admin created: ${email}`)
}

export async function seedInitialData() {
  await seedSuperAdmin()
  await seedPermissions()

  const categoriesCount = await prisma.category.count()
  if (categoriesCount === 0) {
    const defaultCategories = [
      { name: "Servicios Básicos", type: "EXPENSE", color: "#2563EB", icon: "zap" },
      { name: "Arriendo", type: "EXPENSE", color: "#14B8A6", icon: "home" },
      { name: "Remuneraciones", type: "EXPENSE", color: "#8B5CF6", icon: "users" },
      { name: "Insumos", type: "EXPENSE", color: "#F59E0B", icon: "package" },
      { name: "Transporte", type: "EXPENSE", color: "#EF4444", icon: "truck" },
      { name: "Marketing", type: "EXPENSE", color: "#EC4899", icon: "megaphone" },
      { name: "Tecnología", type: "EXPENSE", color: "#06B6D4", icon: "monitor" },
      { name: "Asesorías", type: "EXPENSE", color: "#10B981", icon: "briefcase" },
      { name: "Ventas", type: "INCOME", color: "#22C55E", icon: "trending-up" },
      { name: "Servicios", type: "INCOME", color: "#2563EB", icon: "service" },
      { name: "Otros Ingresos", type: "INCOME", color: "#14B8A6", icon: "plus-circle" },
    ]

    for (const cat of defaultCategories) {
      await prisma.category.create({ data: cat })
    }
    console.log("Default categories created")
  }

  const costCentersCount = await prisma.costCenter.count()
  if (costCentersCount === 0) {
    const defaultCostCenters = [
      { name: "Administración", code: "CC-001" },
      { name: "Operaciones", code: "CC-002" },
      { name: "Ventas", code: "CC-003" },
      { name: "TI", code: "CC-004" },
      { name: "Marketing", code: "CC-005" },
    ]

    for (const cc of defaultCostCenters) {
      await prisma.costCenter.create({ data: cc })
    }
    console.log("Default cost centers created")
  }

  const companiesCount = await prisma.company.count()
  if (companiesCount === 0) {
    await prisma.company.create({
      data: {
        name: "Omnes Holding SPA",
        rut: "77.123.456-7",
        address: "Santiago, Chile",
        email: "contacto@omnesholding.cl",
      },
    })
    console.log("Default company created")
  }
}
