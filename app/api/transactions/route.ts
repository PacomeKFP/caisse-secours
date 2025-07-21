import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { TransactionSchema } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = TransactionSchema.parse(body)

    const result = await prisma.$transaction(async (tx) => {
      // Create transaction
      const transaction = await tx.transaction.create({
        data: validatedData,
      })

      // Update client balance
      const balanceChange = validatedData.type === "DEPOT" ? validatedData.montant : -validatedData.montant

      await tx.client.update({
        where: { id: validatedData.clientId },
        data: {
          solde: {
            increment: balanceChange,
          },
        },
      })

      return transaction
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 })
  }
}
