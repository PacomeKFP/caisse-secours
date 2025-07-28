import { NextResponse } from 'next/server'
import { DashboardService } from '@/lib/services/dashboardService'
import { isAuthenticated } from '@/lib/auth/session'

export async function GET() {
  try {
    const authenticated = await isAuthenticated()
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [stats, recentTransactions, topClients, evolution] = await Promise.all([
      DashboardService.getDashboardStats(),
      DashboardService.getRecentTransactions(5),
      DashboardService.getTopClients(5),
      DashboardService.getTransactionEvolution(7)
    ])

    return NextResponse.json({
      stats,
      recentTransactions,
      topClients,
      evolution
    })
  } catch (error) {
    console.error('GET /api/dashboard error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}