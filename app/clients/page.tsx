"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Eye, Edit, Trash2 } from "lucide-react"
import { ClientForm } from "@/components/client-form"
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"

interface Client {
  id: string
  matricule: string
  nom: string
  telephone: string
  solde: number
  dateCreation: string
  _count: {
    transactions: number
    commissions: number
  }
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [deletingClient, setDeletingClient] = useState<Client | null>(null)

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
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (client: Client) => {
    try {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setClients(clients.filter((c) => c.id !== client.id))
        setDeletingClient(null)
      }
    } catch (error) {
      console.error("Failed to delete client:", error)
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

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground">Manage your clients and their information</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Client
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Client List</CardTitle>
          <CardDescription>
            {clients.length} client{clients.length !== 1 ? "s" : ""} registered
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Matricule</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Transactions</TableHead>
                <TableHead>Commissions</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.matricule}</TableCell>
                  <TableCell>{client.nom}</TableCell>
                  <TableCell>{client.telephone}</TableCell>
                  <TableCell>
                    <Badge variant={client.solde >= 0 ? "default" : "destructive"}>
                      {formatCurrency(client.solde)}
                    </Badge>
                  </TableCell>
                  <TableCell>{client._count.transactions}</TableCell>
                  <TableCell>{client._count.commissions}</TableCell>
                  <TableCell>{formatDate(client.dateCreation)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/clients/${client.id}`}>
                          <Eye className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingClient(client)
                          setShowForm(true)
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setDeletingClient(client)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {showForm && (
        <ClientForm
          client={editingClient}
          onClose={() => {
            setShowForm(false)
            setEditingClient(null)
          }}
          onSuccess={() => {
            fetchClients()
            setShowForm(false)
            setEditingClient(null)
          }}
        />
      )}

      {deletingClient && (
        <DeleteConfirmDialog
          title="Delete Client"
          description={`Are you sure you want to delete ${deletingClient.nom}? This action cannot be undone and will also delete all associated transactions and commissions.`}
          onConfirm={() => handleDelete(deletingClient)}
          onCancel={() => setDeletingClient(null)}
        />
      )}
    </div>
  )
}
