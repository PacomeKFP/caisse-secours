import { redirect } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth/session'
import Sidebar from '@/components/Sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const authenticated = await isAuthenticated()
  
  if (!authenticated) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 lg:ml-0 ml-0">
        <main className="p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}