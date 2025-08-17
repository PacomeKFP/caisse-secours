import { NextRequest, NextResponse } from 'next/server'
import { TransactionService } from '@/lib/services/transactionService'
import { ConfigService } from '@/lib/services/configService'
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

    // Validation des champs requis
    if (!clientId || !type || !montant || !sourceDestination) {
      return NextResponse.json(
        { 
          error: 'Champs requis manquants',
          details: 'Les champs clientId, type, montant et sourceDestination sont obligatoires',
          received: { clientId: !!clientId, type: !!type, montant: !!montant, sourceDestination: !!sourceDestination }
        },
        { status: 400 }
      )
    }

    // Validation du type de données
    if (typeof montant !== 'number' || isNaN(montant)) {
      return NextResponse.json(
        { 
          error: 'Type de données invalide',
          details: 'Le montant doit être un nombre valide',
          received: { montant, type: typeof montant }
        },
        { status: 400 }
      )
    }

    // Validation du montant minimum
    if (montant <= 0) {
      return NextResponse.json(
        { 
          error: 'Montant invalide',
          details: 'Le montant doit être strictement positif (> 0)',
          received: { montant }
        },
        { status: 400 }
      )
    }

    // Récupérer les limites de transaction depuis la configuration
    const limits = await ConfigService.getTransactionLimits()
    
    // Validation du montant maximum
    if (montant > limits.maxAmount) {
      return NextResponse.json(
        { 
          error: 'Montant trop élevé',
          details: `Le montant maximum autorisé est de ${limits.maxAmount.toLocaleString()} FCFA`,
          received: { montant },
          limit: limits.maxAmount
        },
        { status: 400 }
      )
    }

    // Validation du type de transaction
    if (!['depot', 'retrait'].includes(type)) {
      return NextResponse.json(
        { 
          error: 'Type de transaction invalide',
          details: 'Le type doit être "depot" ou "retrait"',
          received: { type },
          allowed: ['depot', 'retrait']
        },
        { status: 400 }
      )
    }

    // Validation des montants minimum par type
    if (type === 'depot' && montant < limits.minDepot) {
      return NextResponse.json(
        { 
          error: 'Montant de dépôt trop faible',
          details: `Le montant minimum pour un dépôt est de ${limits.minDepot} FCFA`,
          received: { montant, type },
          minimum: limits.minDepot
        },
        { status: 400 }
      )
    }

    if (type === 'retrait' && montant < limits.minRetrait) {
      return NextResponse.json(
        { 
          error: 'Montant de retrait trop faible',
          details: `Le montant minimum pour un retrait est de ${limits.minRetrait} FCFA`,
          received: { montant, type },
          minimum: limits.minRetrait
        },
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