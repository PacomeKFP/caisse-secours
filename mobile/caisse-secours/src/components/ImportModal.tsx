import { useState } from 'react'
import type { ImportClientsData } from '../types'

interface ImportModalProps {
  onImport: (data: ImportClientsData) => void
  onClose: () => void
}

export default function ImportModal({ onImport, onClose }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.type !== 'application/json') {
      alert('Seuls les fichiers JSON sont acceptés')
      return
    }
    setFile(selectedFile)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!file) {
      alert('Veuillez sélectionner un fichier')
      return
    }

    try {
      const text = await file.text()
      const data = JSON.parse(text)
      
      // Validation format (nouveau standard ou ancien)
      let clientsData
      if (data.clients && Array.isArray(data.clients)) {
        // Format nouveau standard interopérable
        clientsData = data.clients
      } else if (Array.isArray(data)) {
        // Format ancien (tableau direct)
        clientsData = data
      } else {
        alert('Format de fichier invalide. Attendu: {clients: [...]} ou tableau direct.')
        return
      }
      
      if (!Array.isArray(clientsData) || clientsData.length === 0) {
        alert('Aucun client trouvé dans le fichier')
        return
      }
      
      // Convertir au format attendu par la fonction d'import
      const importData: ImportClientsData = {
        clients: clientsData
      }

      // Validation des champs requis
      const invalidClients = clientsData.filter((client: any) => 
        !client.matricule || !client.nom || !client.telephone
      )

      if (invalidClients.length > 0) {
        alert(`${invalidClients.length} clients ont des champs manquants (matricule, nom, téléphone)`)
        return
      }

      onImport(importData)

    } catch (error) {
      alert('Erreur lors de la lecture du fichier: ' + (error instanceof Error ? error.message : 'Format invalide'))
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      handleFileSelect(droppedFile)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Importer des clients</h2>
        <p style={{ color: '#86868b', marginBottom: '1.5rem', fontSize: '0.9375rem' }}>
          Sélectionnez un fichier JSON exporté depuis l'application principale
        </p>
        
        <form onSubmit={handleSubmit}>
          <div 
            className={`file-drop-zone ${dragOver ? 'drag-over' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            style={{
              border: `2px dashed ${dragOver ? '#007AFF' : '#d1d1d6'}`,
              borderRadius: '8px',
              padding: '2rem 1rem',
              textAlign: 'center',
              marginBottom: '1.5rem',
              background: dragOver ? '#f0f8ff' : '#f9f9f9',
              transition: 'all 0.15s ease'
            }}
          >
            {file ? (
              <div>
                <p style={{ fontWeight: '500', color: '#1d1d1f' }}>
                  {file.name}
                </p>
                <p style={{ fontSize: '0.875rem', color: '#86868b', marginTop: '0.25rem' }}>
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            ) : (
              <div>
                <p style={{ fontWeight: '500', color: '#1d1d1f', marginBottom: '0.5rem' }}>
                  Glissez un fichier JSON ici
                </p>
                <p style={{ fontSize: '0.875rem', color: '#86868b' }}>
                  ou cliquez pour sélectionner
                </p>
              </div>
            )}
          </div>

          <input
            type="file"
            accept=".json"
            onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            style={{ display: 'none' }}
            id="file-input"
          />
          
          <label htmlFor="file-input" className="btn btn-secondary" style={{ width: '100%', marginBottom: '1rem' }}>
            Choisir un fichier
          </label>

          <div style={{ 
            background: '#f2f2f7', 
            padding: '1rem', 
            borderRadius: '8px', 
            marginBottom: '1.5rem',
            fontSize: '0.875rem' 
          }}>
            <p style={{ color: '#1d1d1f', fontWeight: '500', marginBottom: '0.5rem' }}>
              Format attendu:
            </p>
            <pre style={{ 
              color: '#86868b', 
              fontSize: '0.8125rem', 
              lineHeight: '1.4',
              overflow: 'auto' 
            }}>
{`{
  "clients": [
    {
      "matricule": "CL001",
      "nom": "Jean Dupont", 
      "telephone": "+225..."
    }
  ]
}`}
            </pre>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn" disabled={!file}>
              Importer
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}