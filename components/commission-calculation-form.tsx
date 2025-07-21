"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { CommissionCalculationSchema } from "@/lib/types"

interface Client {
  id: string
  matricule: string
  nom: string
}

interface CommissionCalculationFormProps {
  onClose: () => void
  onSuccess: () => void
}

export function CommissionCalculationForm({ onClose, onSuccess }: CommissionCalculationFormProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClients, setSelectedClients] = useState<string[]>([])
  const [formData, setFormData] = useState({
    mois: new Date().getMonth() + 1,
    annee: new Date().getFullYear(),
  })
  const [loading, setLoading] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<any>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients")
      const data = await response.json()
      setClients(data)
    } catch (error) {
      console.error("Failed to fetch clients:", error)
    }
  }

  const handleClientToggle = (clientId: string) => {
    setSelectedClients((prev) => (prev.includes(clientId) ? prev.filter((id) => id !== clientId) : [...prev, clientId]))
  }

  const handleSelectAll = () => {
    setSelectedClients(selectedClients.length === clients.length ? [] : clients.map((c) => c.id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCalculating(true)
    setProgress(0)
    setErrors({})
    setResults(null)

    try {
      const validatedData = CommissionCalculationSchema.parse({
        ...formData,
        clientIds: selectedClients.length > 0 ? selectedClients : undefined,
      })

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      const response = await fetch("/api/commissions/calculate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validatedData),
      })

      clearInterval(progressInterval)
      setProgress(100)

      const data = await response.json()

      if (response.ok) {
        setResults(data)
        if (data.errors.length === 0) {
          setTimeout(() => onSuccess(), 2000)
        }
      } else {
        setErrors({ general: data.error || "Failed to calculate commissions" })
      }
    } catch (error: any) {
      if (error.errors) {
        const fieldErrors: Record<string, string> = {}
        error.errors.forEach((err: any) => {
          fieldErrors[err.path[0]] = err.message
        })
        setErrors(fieldErrors)
      } else {
        setErrors({ general: "Failed to calculate commissions" })
      }
    } finally {
      setCalculating(false)
    }
  }

  const getMonthName = (month: number) => {
    const months = [
      "Janvier",
      "Février",
      "Mars",
      "Avril",
      "Mai",
      "Juin",
      "Juillet",
      "Août",
      "Septembre",
      "Octobre",
      "Novembre",
      "Décembre",
    ]
    return months[month - 1]
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Calculate Monthly Commissions</DialogTitle>
          <DialogDescription>Calculate commissions for the selected month and clients</DialogDescription>
        </DialogHeader>

        {!results ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="mois">Month</Label>
                <Select
                  value={formData.mois.toString()}
                  onValueChange={(value) => setFormData({ ...formData, mois: Number.parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {getMonthName(i + 1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.mois && <p className="text-sm text-red-500 mt-1">{errors.mois}</p>}
              </div>

              <div>
                <Label htmlFor="annee">Year</Label>
                <Input
                  id="annee"
                  type="number"
                  min="2020"
                  value={formData.annee}
                  onChange={(e) => setFormData({ ...formData, annee: Number.parseInt(e.target.value) })}
                />
                {errors.annee && <p className="text-sm text-red-500 mt-1">{errors.annee}</p>}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <Label>Select Clients (optional)</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleSelectAll}>
                  {selectedClients.length === clients.length ? "Deselect All" : "Select All"}
                </Button>
              </div>

              <div className="max-h-48 overflow-y-auto border rounded-md p-4 space-y-2">
                {clients.map((client) => (
                  <div key={client.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={client.id}
                      checked={selectedClients.includes(client.id)}
                      onCheckedChange={() => handleClientToggle(client.id)}
                    />
                    <Label htmlFor={client.id} className="flex-1 cursor-pointer">
                      {client.matricule} - {client.nom}
                    </Label>
                  </div>
                ))}
              </div>

              <p className="text-sm text-muted-foreground mt-2">
                {selectedClients.length === 0
                  ? "All clients will be processed"
                  : `${selectedClients.length} client(s) selected`}
              </p>
            </div>

            {calculating && (
              <div className="space-y-2">
                <Label>Calculating commissions...</Label>
                <Progress value={progress} />
                <p className="text-sm text-muted-foreground">{progress}% complete</p>
              </div>
            )}

            {errors.general && (
              <Alert>
                <AlertDescription>{errors.general}</AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={calculating}>
                Cancel
              </Button>
              <Button type="submit" disabled={calculating}>
                {calculating ? "Calculating..." : "Calculate Commissions"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{results.summary.successful}</p>
                <p className="text-sm text-muted-foreground">Successful</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{results.summary.failed}</p>
                <p className="text-sm text-muted-foreground">Failed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{results.summary.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>

            {results.errors.length > 0 && (
              <div>
                <Label className="text-red-600">Errors:</Label>
                <div className="max-h-32 overflow-y-auto border rounded-md p-2 mt-2">
                  {results.errors.map((error: any, index: number) => (
                    <div key={index} className="text-sm text-red-600 mb-1">
                      {error.clientName}: {error.error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.success.length > 0 && (
              <div>
                <Label className="text-green-600">Successfully processed:</Label>
                <div className="max-h-32 overflow-y-auto border rounded-md p-2 mt-2">
                  {results.success.map((success: any, index: number) => (
                    <div key={index} className="text-sm text-green-600 mb-1">
                      {success.clientName}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button onClick={onClose}>Close</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
