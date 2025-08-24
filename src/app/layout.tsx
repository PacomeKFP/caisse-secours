import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Caisse Secours - Gestion Microfinance',
  description: 'Application de gestion microfinance pour Caisse Secours - Clients, transactions et prêts',
  icons: {
    icon: '/logo-caisse-secours.svg',
    shortcut: '/logo-caisse-secours.svg',
    apple: '/logo-caisse-secours.svg',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}