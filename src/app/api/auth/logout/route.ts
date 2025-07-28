import { NextResponse } from 'next/server'
import { deleteSession } from '@/lib/auth/session'

export async function POST() {
  try {
    await deleteSession()
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error logging out' },
      { status: 500 }
    )
  }
}