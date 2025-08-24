import { StandardExportFormat } from '@/types'

// Export au format standard interopérable
export const exportToJSON = (data: any[], filename: string, type: 'clients' | 'transactions' | 'commissions') => {
  const standardFormat: StandardExportFormat = {
    [type]: data,
    metadata: {
      exportDate: new Date().toISOString(),
      source: 'web' as const,
      version: '1.0.0',
      total: data.length
    }
  }
  
  const jsonData = JSON.stringify(standardFormat, null, 2)
  const blob = new Blob([jsonData], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return

  // Obtenir les en-têtes depuis le premier objet
  const headers = Object.keys(data[0])
  
  // Créer le contenu CSV
  const csvContent = [
    // En-têtes
    headers.map(header => `"${header}"`).join(','),
    // Données
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]
        // Échapper les guillemets et encapsuler dans des guillemets
        if (typeof value === 'string') {
          return `"${value.replace(/"/g, '""')}"`
        }
        return `"${value || ''}"`
      }).join(',')
    )
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Fonction pour formater les données avant export (CSV uniquement)
export const formatDataForExport = (data: any[], type: 'clients' | 'transactions' | 'commissions') => {
  return data.map(item => {
    const formatted = { ...item }
    
    // Formater les dates pour CSV (lisible)
    if (formatted.createdAt) {
      formatted.createdAt = new Date(formatted.createdAt).toLocaleString('fr-FR')
    }
    if (formatted.updatedAt) {
      formatted.updatedAt = new Date(formatted.updatedAt).toLocaleString('fr-FR')
    }
    
    // Formater les montants selon le type pour CSV
    if (type === 'clients') {
      if (formatted.totalDepots) formatted.totalDepots = `${formatted.totalDepots.toLocaleString('fr-FR')} FCFA`
      if (formatted.totalRetraits) formatted.totalRetraits = `${formatted.totalRetraits.toLocaleString('fr-FR')} FCFA`
      if (formatted.totalCommissions) formatted.totalCommissions = `${formatted.totalCommissions.toLocaleString('fr-FR')} FCFA`
      if (formatted.solde !== undefined) formatted.solde = `${formatted.solde.toLocaleString('fr-FR')} FCFA`
    }
    
    if (type === 'transactions') {
      if (formatted.montant) formatted.montant = `${formatted.montant.toLocaleString('fr-FR')} FCFA`
    }
    
    if (type === 'commissions') {
      if (formatted.montantTotal) formatted.montantTotal = `${formatted.montantTotal.toLocaleString('fr-FR')} FCFA`
      if (formatted.commission) formatted.commission = `${formatted.commission.toLocaleString('fr-FR')} FCFA`
    }
    
    return formatted
  })
}

// Fonction pour obtenir données brutes (sans formatage) pour JSON interopérable
export const getRawDataForJSON = (data: any[]) => {
  return data.map(item => {
    const raw = { ...item }
    
    // Conserver dates au format ISO
    if (raw.createdAt && typeof raw.createdAt === 'string') {
      raw.createdAt = new Date(raw.createdAt).toISOString()
    }
    if (raw.updatedAt && typeof raw.updatedAt === 'string') {
      raw.updatedAt = new Date(raw.updatedAt).toISOString()
    }
    
    // Conserver montants en nombres pour interopérabilité
    return raw
  })
}