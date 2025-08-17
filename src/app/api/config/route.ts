import { NextRequest, NextResponse } from 'next/server'
import { ConfigService } from '@/lib/services/configService'
import { isAuthenticated } from '@/lib/auth/session'

export async function GET(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated()
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    if (category) {
      // Récupérer la configuration d'une catégorie spécifique
      const config = await ConfigService.getByCategory(category)
      return NextResponse.json({ category, config })
    } else {
      // Récupérer toute la configuration
      const allConfig = await ConfigService.getAll()
      return NextResponse.json(allConfig)
    }
  } catch (error) {
    console.error('GET /api/config error:', error)
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
    const { category, key, value } = body

    if (!category || !key || value === undefined) {
      return NextResponse.json(
        { 
          error: 'Champs requis manquants',
          details: 'Les champs category, key et value sont obligatoires'
        },
        { status: 400 }
      )
    }

    await ConfigService.set(category, key, value, 'admin')
    
    return NextResponse.json({
      success: true,
      message: 'Configuration mise à jour avec succès',
      updated: { category, key, value }
    })
  } catch (error) {
    console.error('PUT /api/config error:', error)
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
    const { action, category, key } = body

    if (action === 'reset') {
      if (category && key) {
        // Réinitialiser une configuration spécifique
        await ConfigService.resetToDefault(category, key)
        return NextResponse.json({
          success: true,
          message: `Configuration ${category}.${key} réinitialisée`
        })
      } else {
        // Réinitialiser toute la configuration
        await ConfigService.resetAllToDefault()
        return NextResponse.json({
          success: true,
          message: 'Toute la configuration a été réinitialisée'
        })
      }
    } else if (action === 'initialize') {
      // Initialiser la configuration
      await ConfigService.initializeConfig()
      return NextResponse.json({
        success: true,
        message: 'Configuration initialisée avec succès'
      })
    }

    return NextResponse.json(
      { error: 'Action non reconnue' },
      { status: 400 }
    )
  } catch (error) {
    console.error('POST /api/config error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}