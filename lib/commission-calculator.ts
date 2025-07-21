import { prisma } from "./db"
import { COMMISSION_GRID } from "./types"

export class CommissionCalculator {
  static async canCalculateCommission(month: number, year: number): Promise<boolean> {
    const now = new Date()
    const targetDate = new Date(year, month - 1, 5) // 5th of the target month
    const nextMonth = new Date(year, month, 5) // 5th of next month

    return now >= nextMonth
  }

  static async getMissingCommissionMonths(
    clientId: string,
    targetMonth: number,
    targetYear: number,
  ): Promise<Array<{ month: number; year: number }>> {
    const existingCommissions = await prisma.commission.findMany({
      where: { clientId },
      select: { mois: true, annee: true },
      orderBy: [{ annee: "asc" }, { mois: "asc" }],
    })

    const missing: Array<{ month: number; year: number }> = []
    const target = new Date(targetYear, targetMonth - 1)

    // Find the earliest transaction date for this client
    const firstTransaction = await prisma.transaction.findFirst({
      where: { clientId },
      orderBy: { dateCreation: "asc" },
    })

    if (!firstTransaction) return missing

    const start = new Date(firstTransaction.dateCreation.getFullYear(), firstTransaction.dateCreation.getMonth())

    for (let d = new Date(start); d < target; d.setMonth(d.getMonth() + 1)) {
      const month = d.getMonth() + 1
      const year = d.getFullYear()

      const exists = existingCommissions.some((c) => c.mois === month && c.annee === year)
      if (!exists && (await this.canCalculateCommission(month, year))) {
        missing.push({ month, year })
      }
    }

    return missing
  }

  static calculateCommissionAmount(totalDeposits: number): number {
    let commission = 0
    let remaining = totalDeposits

    for (const tier of COMMISSION_GRID) {
      if (remaining <= 0) break

      const tierAmount = Math.min(remaining, tier.max - tier.min + 1)
      commission += tierAmount * tier.rate
      remaining -= tierAmount
    }

    return commission
  }

  static async calculateClientCommission(clientId: string, month: number, year: number): Promise<void> {
    // Check if commission already exists
    const existing = await prisma.commission.findUnique({
      where: {
        clientId_mois_annee: {
          clientId,
          mois: month,
          annee: year,
        },
      },
    })

    if (existing) {
      throw new Error(`Commission already calculated for ${month}/${year}`)
    }

    // Check temporal constraint
    if (!(await this.canCalculateCommission(month, year))) {
      throw new Error(`Cannot calculate commission for ${month}/${year} before the 5th of the following month`)
    }

    // Check for missing previous months
    const missingMonths = await this.getMissingCommissionMonths(clientId, month, year)
    if (missingMonths.length > 0) {
      throw new Error(
        `Missing commissions for previous months: ${missingMonths.map((m) => `${m.month}/${m.year}`).join(", ")}`,
      )
    }

    // Get deposits for the month
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59)

    const deposits = await prisma.transaction.findMany({
      where: {
        clientId,
        type: "DEPOT",
        dateCreation: {
          gte: startDate,
          lte: endDate,
        },
      },
    })

    const totalDeposits = deposits.reduce((sum, deposit) => sum + deposit.montant, 0)
    const commissionAmount = this.calculateCommissionAmount(totalDeposits)

    if (commissionAmount > 0) {
      await prisma.$transaction(async (tx) => {
        // Create commission record
        await tx.commission.create({
          data: {
            montantTotal: totalDeposits,
            montantCommission: commissionAmount,
            label: `Commission ${this.getMonthName(month)} ${year}`,
            mois: month,
            annee: year,
            clientId,
          },
        })

        // Create withdrawal transaction for commission
        await tx.transaction.create({
          data: {
            montant: commissionAmount,
            type: "RETRAIT",
            raison: `Commission ${this.getMonthName(month)} ${year}`,
            clientId,
          },
        })

        // Update client balance
        await tx.client.update({
          where: { id: clientId },
          data: {
            solde: {
              decrement: commissionAmount,
            },
          },
        })
      })
    }
  }

  static getMonthName(month: number): string {
    const months = [
      "Janvier",
      "Février",
      "Mars",
      "Avril",
      "Mai",
      "Juin",
      "Juillet",
      "Août",
      "Septembre",
      "Octobre",
      "Novembre",
      "Décembre",
    ]
    return months[month - 1]
  }
}
