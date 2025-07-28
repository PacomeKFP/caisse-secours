export function formatCurrency(amount: number): string {
  return amount.toLocaleString('fr-FR') + ' FCFA'
}

export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function getCurrentMonth(): { year: number; month: number } {
  const now = new Date()
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1
  }
}

export function getMonthName(month: number): string {
  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ]
  return months[month - 1] || ''
}

export function validatePhoneNumber(phone: string): boolean {
  // Basic phone validation for Cameroon
  const phoneRegex = /^(\+237|237)?[6789]\d{7,8}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

export function generateMatriculeNumber(lastNumber: number): string {
  const nextNumber = lastNumber + 1
  return `CLT${nextNumber.toString().padStart(3, '0')}`
}