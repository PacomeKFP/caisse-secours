import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'
import { Capacitor } from '@capacitor/core'

// Fonction pour créer un nom de fichier avec date/heure
export const generateFileName = (prefix: string = 'CaisseSecours', type: string = 'Export'): string => {
  const now = new Date()
  const date = now.toISOString().split('T')[0] // YYYY-MM-DD
  const time = now.toTimeString().split(' ')[0].replace(/:/g, 'h') // HHhMMhSS
  return `${prefix}_${type}_${date}_${time}.json`
}

// Export vers le système de fichiers avec Capacitor
export const exportToDocuments = async (data: any, filename?: string): Promise<{ success: boolean; path?: string; error?: string }> => {
  try {
    const finalFilename = filename || generateFileName('CaisseSecours', 'Transactions')
    
    if (Capacitor.isNativePlatform()) {
      // Sur mobile natif, utiliser Capacitor Filesystem
      await Filesystem.writeFile({
        path: `CaisseSecours/${finalFilename}`,
        data: JSON.stringify(data, null, 2),
        directory: Directory.Documents,
        encoding: Encoding.UTF8
      })
      
      return {
        success: true,
        path: `Documents/CaisseSecours/${finalFilename}`
      }
    } else {
      // Fallback navigateur (téléchargement classique)
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = finalFilename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      return {
        success: true,
        path: `Téléchargements/${finalFilename}`
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur d\'export'
    }
  }
}

// Fonction pour s'assurer que le dossier CaisseSecours existe
export const ensureExportDirectory = async (): Promise<void> => {
  if (Capacitor.isNativePlatform()) {
    try {
      await Filesystem.mkdir({
        path: 'CaisseSecours',
        directory: Directory.Documents,
        recursive: true
      })
    } catch (error) {
      // Le dossier existe déjà, pas d'erreur
    }
  }
}

// Fonction pour lister les exports existants
export const listExports = async (): Promise<string[]> => {
  if (Capacitor.isNativePlatform()) {
    try {
      const result = await Filesystem.readdir({
        path: 'CaisseSecours',
        directory: Directory.Documents
      })
      
      return result.files
        .filter(file => file.name.endsWith('.json'))
        .map(file => file.name)
        .sort()
        .reverse() // Plus récents en premier
    } catch (error) {
      return []
    }
  }
  return []
}