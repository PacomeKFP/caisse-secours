"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { TransactionSchema } from "@/lib/types"

interface TransactionFormProps {
  clientId: string
  onClose: () => void
  onSuccess: () => void
}

export function TransactionForm({ clientId, onClose, onSuccess }: TransactionFormProps) {
  const [formData, setFormData] = useState({
    montant: "",
    type: "",
    raison: "",
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      const validatedData = TransactionSchema.parse({
        ...formData,
        montant: Number.parseFloat(formData.montant),
        clientId,
      })

      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validatedData),
      })

      if (response.ok) {
        onSuccess()
      } else {
        const error = await response.json()
        setErrors({ general: error.error || "Failed to create transaction" })
      }
    } catch (error: any) {
      if (error.errors) {
        const fieldErrors: Record<string, string> = {}
        error.errors.forEach((err: any) => {
          fieldErrors[err.path[0]] = err.message
        })
        setErrors(fieldErrors)
      } else {
        setErrors({ general: "Failed to create transaction" })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Transaction</DialogTitle>
          <DialogDescription>Create a new deposit or withdrawal transaction</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="type">Transaction Type</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select transaction type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DEPOT">Deposit</SelectItem>
                <SelectItem value="RETRAIT">Withdrawal</SelectItem>
              </SelectContent>
            </Select>
            {errors.type && <p className="text-sm text-red-500 mt-1">{errors.type}</p>}
          </div>

          <div>
            <Label htmlFor="montant">Amount</Label>
            <Input
              id="montant"
              type="number"
              step="0.01"
              value={formData.montant}
              onChange={(e) => setFormData({ ...formData, montant: e.target.value })}
              placeholder="Enter amount"
            />
            {errors.montant && <p className="text-sm text-red-500 mt-1">{errors.montant}</p>}
          </div>

          {formData.type === "RETRAIT" && (
            <div>
              <Label htmlFor="raison">Reason (Optional)</Label>
              <Textarea
                id="raison"
                value={formData.raison}
                onChange={(e) => setFormData({ ...formData, raison: e.target.value })}
                placeholder="Enter reason for withdrawal"
              />
              {errors.raison && <p className="text-sm text-red-500 mt-1">{errors.raison}</p>}
            </div>
          )}

          {errors.general && <p className="text-sm text-red-500">{errors.general}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Transaction"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
