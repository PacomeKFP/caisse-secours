import { NextResponse } from 'next/server'
import { ConfigService } from '@/lib/services/configService'

export async function POST() {
  try {
    console.log('Initialisation de la configuration...')
    await ConfigService.initializeConfig()
    
    return NextResponse.json({
      success: true,
      message: 'Configuration initialisée avec succès'
    })
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la configuration:', error)
    return NextResponse.json(
      { 
        error: 'Erreur lors de l\'initialisation',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}