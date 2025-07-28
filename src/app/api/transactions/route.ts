import { NextRequest, NextResponse } from 'next/server'
import { TransactionService } from '@/lib/services/transactionService'
import { isAuthenticated } from '@/lib/auth/session'

export async function GET(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated()
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const clientId = searchParams.get('clientId') || undefined
    const type = searchParams.get('type') as 'depot' | 'retrait' | undefined
    const startDate = searchParams.get('startDate') || undefined
    const endDate = searchParams.get('endDate') || undefined

    const filters = {
      clientId,
      type,
      startDate,
      endDate
    }

    const transactions = await TransactionService.getAllTransactions(page, limit, filters)
    return NextResponse.json(transactions)
  } catch (error) {
    console.error('GET /api/transactions error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated()
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { clientId, type, montant, description, sourceDestination } = body

    if (!clientId || !type || !montant || !sourceDestination) {
      return NextResponse.json(
        { error: 'Client, type, montant et source/destination sont requis' },
        { status: 400 }
      )
    }

    if (montant <= 0) {
      return NextResponse.json(
        { error: 'Le montant doit être positif' },
        { status: 400 }
      )
    }

    if (!['depot', 'retrait'].includes(type)) {
      return NextResponse.json(
        { error: 'Type de transaction invalide' },
        { status: 400 }
      )
    }

    const transaction = await TransactionService.createTransaction({
      clientId,
      type,
      montant,
      description: description || null,
      sourceDestination
    })

    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    console.error('POST /api/transactions error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}