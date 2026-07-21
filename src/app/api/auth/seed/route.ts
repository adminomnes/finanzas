import { NextResponse } from "next/server"
import { seedInitialData } from "@/lib/seed"

export async function POST() {
  try {
    await seedInitialData()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Seed error:", error)
    return NextResponse.json(
      { error: "Error al inicializar datos" },
      { status: 500 }
    )
  }
}
