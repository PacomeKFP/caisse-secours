"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface Transaction {
  id: string
  montant: number
  type: "DEPOT" | "RETRAIT"
  raison?: string
  dateCreation: string
}

interface TransactionListProps {
  clientId: string
  onUpdate?: () => void
}

export function TransactionList({ clientId, onUpdate }: TransactionListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  })

  useEffect(() => {
    fetchTransactions()
  }, [clientId, filter, pagination.page])

  const fetchTransactions = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filter !== "all" && { type: filter }),
      })

      const response = await fetch(`/api/clients/${clientId}/transactions?${params}`)
      const data = await response.json()

      setTransactions(data.transactions)
      setPagination((prev) => ({ ...prev, ...data.pagination }))
    } catch (error) {
      console.error("Failed to fetch transactions:", error)
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
    return new Date(dateString).toLocaleString("fr-FR")
  }

  if (loading) {
    return <div className="flex justify-center items-center h-32">Loading transactions...</div>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Transactions</CardTitle>
            <CardDescription>
              {pagination.total} transaction{pagination.total !== 1 ? "s" : ""} found
            </CardDescription>
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="DEPOT">Deposits</SelectItem>
              <SelectItem value="RETRAIT">Withdrawals</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  <Badge variant={transaction.type === "DEPOT" ? "default" : "secondary"}>
                    {transaction.type === "DEPOT" ? "Deposit" : "Withdrawal"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className={transaction.type === "DEPOT" ? "text-green-600" : "text-red-600"}>
                    {transaction.type === "DEPOT" ? "+" : "-"}
                    {formatCurrency(transaction.montant)}
                  </span>
                </TableCell>
                <TableCell>{transaction.raison || "-"}</TableCell>
                <TableCell>{formatDate(transaction.dateCreation)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {pagination.pages > 1 && (
          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-muted-foreground">
              Page {pagination.page} of {pagination.pages}
            </p>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.pages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
