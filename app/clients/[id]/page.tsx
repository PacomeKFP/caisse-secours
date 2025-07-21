"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { TransactionList } from "@/components/transaction-list"
import { CommissionList } from "@/components/commission-list"
import { TransactionForm } from "@/components/transaction-form"

interface Client {
  id: string
  matricule: string
  nom: string
  telephone: string
  solde: number
  dateCreation: string
  transactions: any[]
  commissions: any[]
}

export default function ClientDetailPage() {
  const params = useParams()
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [showTransactionForm, setShowTransactionForm] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchClient()
    }
  }, [params.id])

  const fetchClient = async () => {
    try {
      const response = await fetch(`/api/clients/${params.id}`)
      const data = await response.json()
      setClient(data)
    } catch (error) {
      console.error("Failed to fetch client:", error)
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

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  if (!client) {
    return <div className="text-center">Client not found</div>
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{client.nom}</h1>
        <p className="text-muted-foreground">Client Details</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="font-medium">Matricule:</span> {client.matricule}
            </div>
            <div>
              <span className="font-medium">Phone:</span> {client.telephone}
            </div>
            <div>
              <span className="font-medium">Created:</span> {formatDate(client.dateCreation)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={client.solde >= 0 ? "default" : "destructive"} className="text-lg px-3 py-1">
              {formatCurrency(client.solde)}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="font-medium">Transactions:</span> {client.transactions.length}
            </div>
            <div>
              <span className="font-medium">Commissions:</span> {client.commissions.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transactions" className="space-y-4">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="commissions">Commissions</TabsTrigger>
          </TabsList>
          <Button onClick={() => setShowTransactionForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Transaction
          </Button>
        </div>

        <TabsContent value="transactions">
          <TransactionList clientId={client.id} onUpdate={fetchClient} />
        </TabsContent>

        <TabsContent value="commissions">
          <CommissionList clientId={client.id} />
        </TabsContent>
      </Tabs>

      {showTransactionForm && (
        <TransactionForm
          clientId={client.id}
          onClose={() => setShowTransactionForm(false)}
          onSuccess={() => {
            fetchClient()
            setShowTransactionForm(false)
          }}
        />
      )}
    </div>
  )
}
