import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mois = searchParams.get("mois")
    const annee = searchParams.get("annee")

    const where = {
      ...(mois && { mois: Number.parseInt(mois) }),
      ...(annee && { annee: Number.parseInt(annee) }),
    }

    const commissions = await prisma.commission.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            matricule: true,
            nom: true,
          },
        },
      },
      orderBy: [{ annee: "desc" }, { mois: "desc" }, { client: { nom: "asc" } }],
    })

    // Group by month/year
    const grouped = commissions.reduce(
      (acc, commission) => {
        const key = `${commission.mois}-${commission.annee}`
        if (!acc[key]) {
          acc[key] = {
            mois: commission.mois,
            annee: commission.annee,
            totalCommissions: 0,
            totalAmount: 0,
            clientCount: 0,
            commissions: [],
          }
        }

        acc[key].totalCommissions += commission.montantCommission
        acc[key].totalAmount += commission.montantTotal
        acc[key].clientCount += 1
        acc[key].commissions.push(commission)

        return acc
      },
      {} as Record<string, any>,
    )

    return NextResponse.json(Object.values(grouped))
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch commissions" }, { status: 500 })
  }
}
