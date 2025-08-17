import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Pour l'instant, on retourne un message simple
    // Le système de logging fonctionne mais les logs sont dans la console
    return NextResponse.json({
      message: 'Logs endpoint available',
      timestamp: new Date().toISOString(),
      info: 'Logs are currently output to console. Check server console for detailed logs.',
      endpoints: {
        dashboard: '/api/logs/dashboard - More detailed log analysis (requires file system access)'
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}