'use client'

import { useState } from 'react'
import { Download, FileText, Database } from 'lucide-react'
import { toast } from 'sonner'
import { exportToJSON, exportToCSV, formatDataForExport } from '@/lib/utils/exportUtils'

interface ExportButtonProps {
  data: any[]
  filename: string
  type: 'clients' | 'transactions' | 'commissions'
  disabled?: boolean
}

export default function ExportButton({ data, filename, type, disabled = false }: ExportButtonProps) {
  const [showDropdown, setShowDropdown] = useState(false)

  const handleExport = (format: 'json' | 'csv') => {
    if (data.length === 0) {
      toast.error('Aucune donnée à exporter')
      return
    }

    try {
      const formattedData = formatDataForExport(data, type)
      
      if (format === 'json') {
        exportToJSON(formattedData, filename)
        toast.success(`Export JSON réussi: ${data.length} enregistrement(s)`)
      } else {
        exportToCSV(formattedData, filename)
        toast.success(`Export CSV réussi: ${data.length} enregistrement(s)`)
      }
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Erreur lors de l\'export')
    }
    
    setShowDropdown(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={disabled}
        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title={`Exporter ${data.length} enregistrement(s)`}
      >
        <Download size={16} />
        Exporter
      </button>

      {showDropdown && (
        <>
          {/* Overlay pour fermer le dropdown */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowDropdown(false)}
          />
          
          {/* Dropdown menu */}
          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <div className="py-1">
              <button
                onClick={() => handleExport('csv')}
                className="w-full flex items-center gap-3 px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <FileText size={16} className="text-green-600" />
                <div>
                  <div className="font-medium">Exporter en CSV</div>
                  <div className="text-xs text-gray-500">Format tableur</div>
                </div>
              </button>
              
              <button
                onClick={() => handleExport('json')}
                className="w-full flex items-center gap-3 px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Database size={16} className="text-blue-600" />
                <div>
                  <div className="font-medium">Exporter en JSON</div>
                  <div className="text-xs text-gray-500">Format données</div>
                </div>
              </button>
            </div>
            
            <div className="border-t border-gray-100 px-4 py-2">
              <div className="text-xs text-gray-500">
                {data.length} enregistrement(s)
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}