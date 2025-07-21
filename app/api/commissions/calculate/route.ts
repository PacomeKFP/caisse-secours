import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { CommissionCalculationSchema } from "@/lib/types"
import { CommissionCalculator } from "@/lib/commission-calculator"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { mois, annee, clientIds } = CommissionCalculationSchema.parse(body)

    // Get clients to process
    const clients = clientIds
      ? await prisma.client.findMany({ where: { id: { in: clientIds } } })
      : await prisma.client.findMany()

    const results = []
    const errors = []

    for (const client of clients) {
      try {
        // Calculate missing months first
        const missingMonths = await CommissionCalculator.getMissingCommissionMonths(client.id, mois, annee)

        // Calculate all missing months
        for (const { month, year } of missingMonths) {
          await CommissionCalculator.calculateClientCommission(client.id, month, year)
        }

        // Calculate target month
        await CommissionCalculator.calculateClientCommission(client.id, mois, annee)

        results.push({
          clientId: client.id,
          clientName: client.nom,
          success: true,
        })
      } catch (error) {
        errors.push({
          clientId: client.id,
          clientName: client.nom,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    return NextResponse.json({
      success: results,
      errors,
      summary: {
        total: clients.length,
        successful: results.length,
        failed: errors.length,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to calculate commissions" },
      { status: 400 },
    )
  }
}
