"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, CreditCard, Calculator, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react"
import Link from "next/link"

interface DashboardStats {
  totalClients: number
  totalBalance: number
  monthlyCommissions: number
  recentTransactions: number
  topClients: Array<{
    id: string
    nom: string
    solde: number
    commissions: number
  }>
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      // This would be a real API endpoint in production
      const [clientsRes, commissionsRes] = await Promise.all([fetch("/api/clients"), fetch("/api/commissions")])

      const clients = await clientsRes.json()
      const commissions = await commissionsRes.json()

      const currentMonth = new Date().getMonth() + 1
      const currentYear = new Date().getFullYear()

      const monthlyCommissions = commissions
        .filter((c: any) => c.mois === currentMonth && c.annee === currentYear)
        .reduce((sum: number, c: any) => sum + c.totalCommissions, 0)

      const totalBalance = clients.reduce((sum: number, c: any) => sum + c.solde, 0)

      const topClients = clients
        .sort((a: any, b: any) => b.solde - a.solde)
        .slice(0, 5)
        .map((c: any) => ({
          id: c.id,
          nom: c.nom,
          solde: c.solde,
          commissions: c._count?.commissions || 0,
        }))

      setStats({
        totalClients: clients.length,
        totalBalance,
        monthlyCommissions,
        recentTransactions: clients.reduce((sum: number, c: any) => sum + (c._count?.transactions || 0), 0),
        topClients,
      })
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error)
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

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading dashboard...</div>
  }

  if (!stats) {
    return <div className="text-center">Failed to load dashboard data</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your commission management system</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
            <p className="text-xs text-muted-foreground">Active clients in system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalBalance)}</div>
            <p className="text-xs text-muted-foreground">Combined client balances</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Commissions</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.monthlyCommissions)}</div>
            <p className="text-xs text-muted-foreground">Current month total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentTransactions}</div>
            <p className="text-xs text-muted-foreground">All time transactions</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full justify-start" asChild>
              <Link href="/clients">
                <Users className="w-4 h-4 mr-2" />
                Manage Clients
              </Link>
            </Button>
            <Button className="w-full justify-start bg-transparent" variant="outline" asChild>
              <Link href="/commissions">
                <Calculator className="w-4 h-4 mr-2" />
                Calculate Commissions
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Top Clients by Balance</CardTitle>
            <CardDescription>Clients with highest account balances</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topClients.map((client, index) => (
                <div key={client.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    <div>
                      <p className="font-medium">{client.nom}</p>
                      <p className="text-sm text-muted-foreground">
                        {client.commissions} commission{client.commissions !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={client.solde >= 0 ? "default" : "destructive"}>
                      {formatCurrency(client.solde)}
                    </Badge>
                    {client.solde >= 0 ? (
                      <ArrowUpRight className="w-4 h-4 text-green-600" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
