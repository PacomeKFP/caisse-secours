import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { ClientSchema } from "@/lib/types"

export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { dateCreation: "desc" },
      include: {
        _count: {
          select: {
            transactions: true,
            commissions: true,
          },
        },
      },
    })

    return NextResponse.json(clients)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = ClientSchema.parse(body)

    const client = await prisma.client.create({
      data: validatedData,
    })

    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 })
  }
}
