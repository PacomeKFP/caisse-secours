import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') || 'summary'
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    
    // Version simplifiée compatible Edge Runtime
    // Les logs sont actuellement dans la console, pas dans des fichiers
    
    if (type === 'summary') {
      return NextResponse.json({
        date,
        timestamp: new Date().toISOString(),
        message: 'Logs dashboard - Version simplifiée',
        info: 'Les logs sont actuellement envoyés vers la console. Consultez les logs du serveur pour les détails.',
        logs: {
          errors: { count: 0, message: 'Consultez la console du serveur' },
          business: { count: 0, message: 'Consultez la console du serveur' },
          audit: { count: 0, message: 'Consultez la console du serveur' },
          combined: { count: 0, message: 'Consultez la console du serveur' }
        },
        metrics: {
          note: 'Utilisez /api/metrics pour les métriques détaillées',
          suggestion: 'Les logs de production nécessiteraient un système de fichiers ou une base de données'
        }
      })
    } else if (type === 'errors') {
      return NextResponse.json({
        type: 'errors',
        date,
        message: 'Logs d\'erreur non disponibles en mode Edge Runtime',
        suggestion: 'Consultez la console du serveur pour les erreurs'
      })
    } else if (type === 'business') {
      return NextResponse.json({
        type: 'business',
        date,
        message: 'Logs business non disponibles en mode Edge Runtime',
        suggestion: 'Utilisez /api/metrics?format=json pour les données business'
      })
    } else if (type === 'audit') {
      return NextResponse.json({
        type: 'audit',
        date,
        message: 'Logs d\'audit non disponibles en mode Edge Runtime',
        suggestion: 'Les logs d\'audit sont dans la console du serveur'
      })
    } else {
      return NextResponse.json({ 
        error: 'Type non supporté. Types disponibles: summary, errors, business, audit' 
      }, { status: 400 })
    }
  } catch (error) {
    console.error('Erreur logs dashboard:', error)
    
    return NextResponse.json(
      { 
        error: 'Erreur interne du serveur',
        message: 'Consultez les logs de la console pour plus de détails',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}