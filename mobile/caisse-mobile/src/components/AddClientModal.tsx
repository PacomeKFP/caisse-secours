import { useState } from 'react'

interface AddClientModalProps {
  onSave: (client: { matricule: string; nom: string; telephone: string }) => void
  onClose: () => void
}

export default function AddClientModal({ onSave, onClose }: AddClientModalProps) {
  const [matricule, setMatricule] = useState('')
  const [nom, setNom] = useState('')
  const [telephone, setTelephone] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!matricule.trim() || !nom.trim() || !telephone.trim()) {
      alert('Tous les champs sont requis')
      return
    }

    onSave({
      matricule: matricule.trim(),
      nom: nom.trim(),
      telephone: telephone.trim()
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Nouveau client</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Matricule</label>
            <input
              type="text"
              value={matricule}
              onChange={e => setMatricule(e.target.value)}
              placeholder="Ex: CL001"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Nom complet</label>
            <input
              type="text"
              value={nom}
              onChange={e => setNom(e.target.value)}
              placeholder="Ex: Jean Dupont"
            />
          </div>

          <div className="form-group">
            <label>Téléphone</label>
            <input
              type="tel"
              value={telephone}
              onChange={e => setTelephone(e.target.value)}
              placeholder="Ex: +225 01 02 03 04 05"
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn">
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}