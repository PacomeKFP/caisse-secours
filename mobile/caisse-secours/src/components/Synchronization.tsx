import { useState } from 'react'
import { Upload, Download, FileText } from 'lucide-react'
import { getExportRecord, importClients, getTransactionsForExport, updateExportRecord } from '../lib/storage'
import { exportToDocuments, generateFileName } from '../lib/fileExport'
import ExportModal from './ExportModal'
import ImportModal from './ImportModal'
import type { ImportClientsData, StandardExportFormat } from '../types'

export default function Synchronization() {
    const [showExportModal, setShowExportModal] = useState(false)
    const [showImportModal, setShowImportModal] = useState(false)

    const exportRecord = getExportRecord()

    const lastExportDate = exportRecord
        ? new Date(exportRecord.lastExportDate).toLocaleDateString('fr-FR')
        : 'Aucune exportation'

    const handleImport = (data: ImportClientsData) => {
        const result = importClients(data.clients)
        alert(`Import terminé: ${result.imported} clients importés, ${result.skipped} ignorés`)
        setShowImportModal(false)
    }

    const handleExport = async (fromDate: string, toDate: string) => {
        const rawData = getTransactionsForExport(fromDate, toDate)

        if (rawData.transactions.length === 0) {
            alert('Aucune nouvelle transaction à exporter')
            return
        }

        // Format standard interopérable
        const standardFormat: StandardExportFormat = {
            transactions: rawData.transactions,
            metadata: {
                exportDate: new Date().toISOString(),
                source: 'mobile' as const,
                version: '1.0.0',
                total: rawData.transactions.length
            }
        }

        // Exporter avec le nouveau système de fichiers
        const filename = generateFileName('CaisseSecours', 'Transactions')
        const result = await exportToDocuments(standardFormat, filename)

        if (result.success) {
            // Mettre à jour le record d'export
            updateExportRecord(toDate)
            setShowExportModal(false)
            alert(`✅ Export réussi !\n\n${rawData.transactions.length} transactions exportées\n\nFichier: ${result.path}`)
        } else {
            alert(`❌ Erreur d'export:\n${result.error}`)
        }
    }

    return (
        <div className="sync-page">
            <div className="sync-header">
                <h1>Synchronisation</h1>
                <p>Gérer l'import et l'export des données</p>
            </div>

            <div className="sync-actions">
                <button
                    className="sync-card"
                    onClick={() => setShowImportModal(true)}
                >
                    <div className="sync-icon">
                        <Upload size={24} className="text-blue-600" />
                    </div>
                    <div className="sync-content">
                        <h3>Importer des clients</h3>
                        <p>Ajouter de nouveaux clients depuis un fichier</p>
                    </div>
                </button>

                <button
                    className="sync-card"
                    onClick={() => setShowExportModal(true)}
                >
                    <div className="sync-icon">
                        <Download size={24} className="text-green-600" />
                    </div>
                    <div className="sync-content">
                        <h3>Exporter les transactions</h3>
                        <p>Sauvegarder les nouvelles transactions</p>
                    </div>
                </button>

                <div className="sync-info">
                    <div className="sync-icon">
                        <FileText size={24} className="text-gray-600" />
                    </div>
                    <div className="sync-content">
                        <h3>Dernière exportation</h3>
                        <p>{lastExportDate}</p>
                        {exportRecord && (
                            <p className="sync-count">
                                {exportRecord.exportCount} exportation{exportRecord.exportCount > 1 ? 's' : ''}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {showExportModal && (
                <ExportModal 
                    onExport={handleExport} 
                    onClose={() => setShowExportModal(false)} 
                    lastExportDate={exportRecord?.lastExportDate}
                />
            )}

            {showImportModal && (
                <ImportModal 
                    onImport={handleImport} 
                    onClose={() => setShowImportModal(false)} 
                />
            )}
        </div>
    )
}
