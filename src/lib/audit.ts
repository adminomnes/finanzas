import { prisma } from "./prisma"
import type { AuditAction, AuditModule } from "@prisma/client"
import { headers } from "next/headers"

interface AuditEntry {
  userId: string
  role?: string
  action: AuditAction
  module?: AuditModule
  entity: string
  entityId?: string
  description: string
  oldValue?: unknown
  newValue?: unknown
}

interface ParsedUA {
  browser: string
  os: string
  device: string
}

function parseUserAgent(ua: string): ParsedUA {
  const result: ParsedUA = { browser: "Desconocido", os: "Desconocido", device: "Desktop" }

  if (/Edge\/|Edg\//.test(ua)) result.browser = "Edge"
  else if (/Chrome\/|CriOS\//.test(ua)) result.browser = "Chrome"
  else if (/Firefox\/|FxiOS\//.test(ua)) result.browser = "Firefox"
  else if (/Safari\//.test(ua) && !/Chrome\/|CriOS\//.test(ua)) result.browser = "Safari"
  else if (/Opera\/|OPR\//.test(ua)) result.browser = "Opera"
  else if (/MSIE |Trident\//.test(ua)) result.browser = "Internet Explorer"

  if (/Windows NT/.test(ua)) result.os = "Windows"
  else if (/Mac OS X/.test(ua) && !/iPhone|iPad|iPod/.test(ua)) result.os = "macOS"
  else if (/iPhone|iPad|iPod/.test(ua)) result.os = /iPad/.test(ua) ? "iPadOS" : /iPhone/.test(ua) ? "iOS" : "iOS"
  else if (/Android/.test(ua)) result.os = "Android"
  else if (/Linux/.test(ua)) result.os = "Linux"
  else if (/CrOS/.test(ua)) result.os = "ChromeOS"

  if (/iPhone|iPod/.test(ua)) result.device = "iPhone"
  else if (/iPad/.test(ua)) result.device = "iPad"
  else if (/Android/.test(ua) && /Mobile/.test(ua)) result.device = "Móvil"
  else if (/Android/.test(ua)) result.device = "Tablet"
  else if (/Windows Phone/.test(ua)) result.device = "Windows Phone"

  return result
}

function detectModule(entity: string): AuditModule {
  const map: Record<string, AuditModule> = {
    User: "USUARIOS",
    Role: "USUARIOS",
    Permission: "USUARIOS",
    LoginAttempt: "SEGURIDAD",
    Session: "SEGURIDAD",
    Expense: "FINANZAS",
    Income: "FINANZAS",
    Supplier: "PROVEEDORES",
    Setting: "CONFIGURACION",
    AuditLog: "AUDITORIA",
    DevelopmentVersion: "DESARROLLO",
    DevelopmentRoadmap: "DESARROLLO",
    DevelopmentChangelog: "DESARROLLO",
    DevelopmentBacklog: "DESARROLLO",
  }
  return map[entity] || "AUDITORIA"
}

export async function createAuditLog(entry: AuditEntry) {
  try {
    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown"
    const userAgentStr = headersList.get("user-agent") || "unknown"
    const parsed = parseUserAgent(userAgentStr)

    const user = entry.role
      ? null
      : await prisma.user.findUnique({ where: { id: entry.userId }, select: { role: true } })

    await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        role: entry.role || user?.role || "UNKNOWN",
        action: entry.action,
        module: entry.module || detectModule(entry.entity),
        entity: entry.entity,
        entityId: entry.entityId,
        description: entry.description,
        oldValue: entry.oldValue ?? undefined,
        newValue: entry.newValue ?? undefined,
        ipAddress,
        userAgent: userAgentStr,
        browser: parsed.browser,
        os: parsed.os,
        device: parsed.device,
      },
    })
  } catch (error) {
    console.error("Error creating audit log:", error)
  }
}

export function getChangedFields(
  oldValue: Record<string, unknown>,
  newValue: Record<string, unknown>
): { field: string; oldValue: string; newValue: string }[] {
  const changes: { field: string; oldValue: string; newValue: string }[] = []
  const allKeys = new Set([...Object.keys(oldValue), ...Object.keys(newValue)])

  for (const key of allKeys) {
    if (["passwordHash", "updatedAt", "createdAt", "id"].includes(key)) continue
    const oldVal = JSON.stringify(oldValue[key])
    const newVal = JSON.stringify(newValue[key])

    if (oldVal !== newVal) {
      changes.push({
        field: key,
        oldValue: oldValue[key] !== undefined ? String(oldValue[key]) : "(vacío)",
        newValue: newValue[key] !== undefined ? String(newValue[key]) : "(vacío)",
      })
    }
  }

  return changes
}

export function formatAuditId(index: number): string {
  return `AUD-${String(index).padStart(6, "0")}`
}
