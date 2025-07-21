"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface Commission {
  id: string
  montantTotal: number
  montantCommission: number
  label: string
  mois: number
  annee: number
  dateCreation: string
}

interface CommissionListProps {
  clientId: string
}

export function CommissionList({ clientId }: CommissionListProps) {
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCommissions()
  }, [clientId])

  const fetchCommissions = async () => {
    try {
      const response = await fetch(`/api/clients/${clientId}/commissions`)
      const data = await response.json()
      setCommissions(data)
    } catch (error) {
      console.error("Failed to fetch commissions:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR")
  }

  const calculateRate = (commission: number, total: number) => {
    return total > 0 ? ((commission / total) * 100).toFixed(2) : "0.00"
  }

  if (loading) {
    return <div className="flex justify-center items-center h-32">Loading commissions...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Commission History</CardTitle>
        <CardDescription>
          {commissions.length} commission{commissions.length !== 1 ? "s" : ""} calculated
        </CardDescription>
      </CardHeader>
      <CardContent>
        {commissions.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No commissions calculated yet</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Total Deposits</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Date Calculated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {commissions.map((commission) => (
                <TableRow key={commission.id}>
                  <TableCell className="font-medium">{commission.label}</TableCell>
                  <TableCell>{formatCurrency(commission.montantTotal)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{formatCurrency(commission.montantCommission)}</Badge>
                  </TableCell>
                  <TableCell>{calculateRate(commission.montantCommission, commission.montantTotal)}%</TableCell>
                  <TableCell>{formatDate(commission.dateCreation)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
