import { useState, useEffect } from 'react'
import { TrendingUp, Users, DollarSign, Activity } from 'lucide-react'
import { getTodayStats, getTotalClientsBalance, getActiveClientsCount } from '../lib/storage'
import type { DashboardStats } from '../types'

export default function Dashboard() {
    const [stats, setStats] = useState<DashboardStats>({
        totalCollected: 0,
        totalTransactions: 0,
        totalBalance: 0,
        activeClients: 0
    })

    useEffect(() => {
        const todayStats = getTodayStats()
        const totalBalance = getTotalClientsBalance()
        const activeClients = getActiveClientsCount()

        setStats({
            totalCollected: todayStats.totalCollected,
            totalTransactions: todayStats.totalTransactions,
            totalBalance,
            activeClients
        })
    }, [])

    const formatCurrency = (amount: number) => {
        return amount.toLocaleString('fr-FR') + ' FCFA'
    }

    const statCards = [
        {
            icon: DollarSign,
            label: 'Collecté aujourd\'hui',
            value: formatCurrency(stats.totalCollected),
            color: 'text-green-600'
        },
        {
            icon: Activity,
            label: 'Transactions aujourd\'hui',
            value: stats.totalTransactions.toString(),
            color: 'text-blue-600'
        },
        {
            icon: TrendingUp,
            label: 'Solde total',
            value: formatCurrency(stats.totalBalance),
            color: 'text-purple-600'
        },
        {
            icon: Users,
            label: 'Clients actifs',
            value: stats.activeClients.toString(),
            color: 'text-orange-600'
        }
    ]

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>Tableau de bord</h1>
                <p className="dashboard-date">
                    {new Date().toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}
                </p>
            </div>

            <div className="stats-grid">
                {statCards.map((card, index) => {
                    const Icon = card.icon
                    return (
                        <div key={index} className="stat-card">
                            <div className="stat-icon">
                                <Icon size={24} className={card.color} />
                            </div>
                            <div className="stat-content">
                                <p className="stat-value">{card.value}</p>
                                <p className="stat-label">{card.label}</p>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
