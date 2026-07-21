import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth"

export async function GET() {
  try {
    await requireRole("SUPER_ADMIN")

    const currentVersion = await prisma.developmentVersion.findFirst({
      where: { isCurrent: true },
    })

    const totalModules = await prisma.developmentRoadmap.count()
    const completedModules = await prisma.developmentRoadmap.count({
      where: { status: "FINALIZADO" },
    })
    const pendingModules = totalModules - completedModules

    const progress = totalModules === 0 ? 0 : Math.round((completedModules / totalModules) * 100)
    
    // Simulate open issues (could be tracked if we add an Issue table later)
    const openIssues = await prisma.developmentRoadmap.count({
      where: { status: "PENDIENTE" },
    })

    return NextResponse.json({
      data: {
        currentVersion: currentVersion?.version || "No definida",
        status: progress === 100 ? "Estable" : "En desarrollo",
        lastUpdate: currentVersion?.releaseDate || currentVersion?.updatedAt || null,
        totalModules,
        completedModules,
        pendingModules,
        progress,
        openIssues,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
