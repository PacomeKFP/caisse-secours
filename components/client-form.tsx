"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ClientSchema } from "@/lib/types"

interface ClientFormProps {
  client?: any
  onClose: () => void
  onSuccess: () => void
}

export function ClientForm({ client, onClose, onSuccess }: ClientFormProps) {
  const [formData, setFormData] = useState({
    matricule: client?.matricule || "",
    nom: client?.nom || "",
    telephone: client?.telephone || "",
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      const validatedData = ClientSchema.parse(formData)

      const url = client ? `/api/clients/${client.id}` : "/api/clients"
      const method = client ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validatedData),
      })

      if (response.ok) {
        onSuccess()
      } else {
        const error = await response.json()
        setErrors({ general: error.error || "Failed to save client" })
      }
    } catch (error: any) {
      if (error.errors) {
        const fieldErrors: Record<string, string> = {}
        error.errors.forEach((err: any) => {
          fieldErrors[err.path[0]] = err.message
        })
        setErrors(fieldErrors)
      } else {
        setErrors({ general: "Failed to save client" })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{client ? "Edit Client" : "Add New Client"}</DialogTitle>
          <DialogDescription>
            {client ? "Update client information" : "Enter the details for the new client"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="matricule">Matricule</Label>
            <Input
              id="matricule"
              value={formData.matricule}
              onChange={(e) => setFormData({ ...formData, matricule: e.target.value })}
              placeholder="Enter matricule"
            />
            {errors.matricule && <p className="text-sm text-red-500 mt-1">{errors.matricule}</p>}
          </div>

          <div>
            <Label htmlFor="nom">Name</Label>
            <Input
              id="nom"
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              placeholder="Enter full name"
            />
            {errors.nom && <p className="text-sm text-red-500 mt-1">{errors.nom}</p>}
          </div>

          <div>
            <Label htmlFor="telephone">Phone</Label>
            <Input
              id="telephone"
              value={formData.telephone}
              onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
              placeholder="Enter phone number"
            />
            {errors.telephone && <p className="text-sm text-red-500 mt-1">{errors.telephone}</p>}
          </div>

          {errors.general && <p className="text-sm text-red-500">{errors.general}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : client ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
