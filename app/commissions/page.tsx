"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Calculator, Download } from "lucide-react"
import { CommissionCalculationForm } from "@/components/commission-calculation-form"

interface CommissionSummary {
  mois: number
  annee: number
  totalCommissions: number
  totalAmount: number
  clientCount: number
  commissions: any[]
}

export default function CommissionsPage() {
  const [commissions, setCommissions] = useState<CommissionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [showCalculationForm, setShowCalculationForm] = useState(false)
  const [filters, setFilters] = useState({
    mois: "",
    annee: "",
  })

  useEffect(() => {
    fetchCommissions()
  }, [filters])

  const fetchCommissions = async () => {
    try {
      const params = new URLSearchParams()
      if (filters.mois) params.append("mois", filters.mois)
      if (filters.annee) params.append("annee", filters.annee)

      const response = await fetch(`/api/commissions?${params}`)
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

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Commission Management</h1>
          <p className="text-muted-foreground">Calculate and manage monthly commissions</p>
        </div>
        <Button onClick={() => setShowCalculationForm(true)}>
          <Calculator className="w-4 h-4 mr-2" />
          Calculate Commissions
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Filter by Month</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="number"
              min="1"
              max="12"
              placeholder="Month (1-12)"
              value={filters.mois}
              onChange={(e) => setFilters({ ...filters, mois: e.target.value })}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Filter by Year</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="number"
              min="2020"
              placeholder="Year"
              value={filters.annee}
              onChange={(e) => setFilters({ ...filters, annee: e.target.value })}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full bg-transparent">
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Commission Summary</CardTitle>
          <CardDescription>Monthly commission overview</CardDescription>
        </CardHeader>
        <CardContent>
          {commissions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No commissions found for the selected period</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Clients</TableHead>
                  <TableHead>Total Deposits</TableHead>
                  <TableHead>Total Commissions</TableHead>
                  <TableHead>Average Rate</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.map((summary) => (
                  <TableRow key={`${summary.mois}-${summary.annee}`}>
                    <TableCell className="font-medium">
                      {getMonthName(summary.mois)} {summary.annee}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{summary.clientCount}</Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(summary.totalAmount)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{formatCurrency(summary.totalCommissions)}</Badge>
                    </TableCell>
                    <TableCell>
                      {summary.totalAmount > 0
                        ? ((summary.totalCommissions / summary.totalAmount) * 100).toFixed(2)
                        : "0.00"}
                      %
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {showCalculationForm && (
        <CommissionCalculationForm
          onClose={() => setShowCalculationForm(false)}
          onSuccess={() => {
            fetchCommissions()
            setShowCalculationForm(false)
          }}
        />
      )}
    </div>
  )
}
