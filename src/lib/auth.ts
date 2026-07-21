import { SignJWT, jwtVerify } from "jose"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import { prisma } from "./prisma"
import { createAuditLog } from "./audit"
import { v4 as uuidv4 } from "uuid"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret")
const MAX_LOGIN_ATTEMPTS = 5
const LOCK_DURATION_MINUTES = 15

export interface JWTPayload {
  userId: string
  email: string
  role: string
  sessionId: string
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) return "Debe tener al menos 8 caracteres"
  if (!/[A-Z]/.test(password)) return "Debe contener al menos una mayúscula"
  if (!/[a-z]/.test(password)) return "Debe contener al menos una minúscula"
  if (!/[0-9]/.test(password)) return "Debe contener al menos un número"
  if (!/[!@#$%^&*(),.?":{}|<>_\-]/.test(password))
    return "Debe contener al menos un carácter especial"
  return null
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function signToken(payload: JWTPayload, rememberMe = false): Promise<string> {
  const expiresIn = rememberMe ? "30d" : "8h"
  return new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as JWTPayload
  } catch {
    return null
  }
}

export async function checkBruteForce(email: string): Promise<{ blocked: boolean; remainingMinutes?: number }> {
  const recentAttempts = await prisma.loginAttempt.count({
    where: {
      email,
      success: false,
      createdAt: { gte: new Date(Date.now() - LOCK_DURATION_MINUTES * 60 * 1000) },
    },
  })

  if (recentAttempts >= MAX_LOGIN_ATTEMPTS) {
    return { blocked: true, remainingMinutes: LOCK_DURATION_MINUTES }
  }

  return { blocked: false }
}

export async function recordLoginAttempt(
  email: string,
  success: boolean,
  userId?: string
) {
  const headersList = await import("next/headers").then((m) => m.headers())
  const ipAddress = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown"
  const userAgent = headersList.get("user-agent") || "unknown"

  await prisma.loginAttempt.create({
    data: { email, ipAddress, userAgent, success, userId },
  })

  if (!success && userId) {
    const failedCount = await prisma.loginAttempt.count({
      where: { userId, success: false, createdAt: { gte: new Date(Date.now() - LOCK_DURATION_MINUTES * 60 * 1000) } },
    })
    await prisma.user.update({
      where: { id: userId },
      data: { failedAttempts: failedCount },
    })

    if (failedCount >= MAX_LOGIN_ATTEMPTS) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          isLocked: true,
          lockedUntil: new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000),
        },
      })
      await createAuditLog({
        userId,
        action: "ACCOUNT_LOCK",
        entity: "User",
        entityId: userId,
        description: `Cuenta bloqueada por ${MAX_LOGIN_ATTEMPTS} intentos fallidos`,
      })
    }
  }
}

export async function createSession(
  userId: string,
  rememberMe = false
): Promise<string> {
  const headersList = await import("next/headers").then((m) => m.headers())
  const ipAddress = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown"
  const userAgent = headersList.get("user-agent") || "unknown"
  const token = uuidv4()
  const expiresAt = rememberMe
    ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    : new Date(Date.now() + 8 * 60 * 60 * 1000)

  await prisma.session.create({
    data: { token, userId, ipAddress, userAgent, expiresAt },
  })

  return token
}

export async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get("session")?.value

  if (!token) return null

  const payload = await verifyToken(token)
  if (!payload) return null

  const dbSession = await prisma.session.findUnique({
    where: { token: payload.sessionId },
  })

  if (!dbSession || !dbSession.isActive || dbSession.expiresAt < new Date()) {
    return null
  }

  await prisma.session.update({
    where: { id: dbSession.id },
    data: { lastUsed: new Date() },
  })

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      mustChangePwd: true,
      lastLogin: true,
      isLocked: true,
    },
  })

  if (!user || !user.isActive || user.isLocked) return null

  let permissions: string[] = []
  if (user.role === "SUPER_ADMIN") {
    const allPerms = await prisma.permission.findMany({ select: { key: true } })
    permissions = allPerms.map(p => p.key)
  } else {
    const rolePerms = await prisma.rolePermission.findMany({
      where: { role: user.role as never },
      select: { permission: { select: { key: true } } },
    })
    permissions = rolePerms.map(rp => rp.permission.key)
  }

  return { ...user, permissions }
}

export async function requireAuth() {
  const user = await getSession()
  if (!user) throw new Error("Unauthorized")
  return user
}

export async function requireRole(...roles: string[]) {
  const user = await requireAuth()
  if (!roles.includes(user.role)) throw new Error("Forbidden")
  return user
}

export async function requirePermission(permissionKey: string) {
  const user = await requireAuth()

  if (user.role === "SUPER_ADMIN") return user

  const hasPermission = await prisma.rolePermission.findFirst({
    where: {
      role: user.role as never,
      permission: { key: permissionKey },
    },
  })

  if (!hasPermission) throw new Error("Forbidden")
  return user
}

export async function revokeOtherSessions(userId: string, currentSessionId: string) {
  await prisma.session.updateMany({
    where: { userId, id: { not: currentSessionId }, isActive: true },
    data: { isActive: false },
  })
}

export async function getActiveSessions(userId: string) {
  return prisma.session.findMany({
    where: { userId, isActive: true, expiresAt: { gte: new Date() } },
    orderBy: { lastUsed: "desc" },
  })
}

export async function cleanupExpiredSessions() {
  await prisma.session.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  })
}
