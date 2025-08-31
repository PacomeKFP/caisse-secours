import { Home, Users, RefreshCw } from 'lucide-react'
import type { TabType } from '../types'

interface BottomNavigationProps {
    activeTab: TabType
    onTabChange: (tab: TabType) => void
}

export default function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
    const tabs = [
        { id: 'dashboard' as TabType, label: 'Accueil', icon: Home },
        { id: 'clients' as TabType, label: 'Clients', icon: Users },
        { id: 'sync' as TabType, label: 'Synchroniser', icon: RefreshCw }
    ]

    return (
        <nav className="bottom-nav">
            {tabs.map(tab => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id

                return (
                    <button
                        key={tab.id}
                        className={`nav-item ${isActive ? 'active' : ''}`}
                        onClick={() => onTabChange(tab.id)}
                    >
                        <Icon size={24} />
                        <span className="nav-label">{tab.label}</span>
                    </button>
                )
            })}
        </nav>
    )
}
