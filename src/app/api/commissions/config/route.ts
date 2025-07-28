import { NextRequest, NextResponse } from 'next/server'
import { CommissionService } from '@/lib/services/commissionService'
import { isAuthenticated } from '@/lib/auth/session'

export async function GET() {
  try {
    const authenticated = await isAuthenticated()
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const config = await CommissionService.getCommissionConfig()
    return NextResponse.json(config)
  } catch (error) {
    console.error('GET /api/commissions/config error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated()
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { tranches } = body

    if (!Array.isArray(tranches) || tranches.length === 0) {
      return NextResponse.json(
        { error: 'Les tranches de commission sont requises' },
        { status: 400 }
      )
    }

    // Validate tranches
    for (let i = 0; i < tranches.length; i++) {
      const tranche = tranches[i]
      
      if (typeof tranche.montantMin !== 'number' || tranche.montantMin < 0) {
        return NextResponse.json(
          { error: `Montant minimum invalide pour la tranche ${i + 1}` },
          { status: 400 }
        )
      }

      if (tranche.montantMax !== null && (typeof tranche.montantMax !== 'number' || tranche.montantMax <= tranche.montantMin)) {
        return NextResponse.json(
          { error: `Montant maximum invalide pour la tranche ${i + 1}` },
          { status: 400 }
        )
      }

      if (typeof tranche.montant !== 'number' || tranche.montant < 0) {
        return NextResponse.json(
          { error: `Montant de commission invalide pour la tranche ${i + 1}` },
          { status: 400 }
        )
      }
    }

    await CommissionService.updateCommissionConfig(tranches)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('PUT /api/commissions/config error:', error)
    
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