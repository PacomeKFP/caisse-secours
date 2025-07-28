import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { AUTH_CONFIG } from './config'

const secret = new TextEncoder().encode('microfinance-secret-key-change-in-production')

export async function createSession(userId: string) {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(new Date(Date.now() + AUTH_CONFIG.SESSION_DURATION))
    .sign(secret)

  const cookieStore = await cookies()
  cookieStore.set(AUTH_CONFIG.COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: AUTH_CONFIG.SESSION_DURATION / 1000
  })

  return token
}

export async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_CONFIG.COOKIE_NAME)?.value

  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, secret)
    return payload
  } catch (error) {
    return null
  }
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete(AUTH_CONFIG.COOKIE_NAME)
}

export async function isAuthenticated() {
  const session = await getSession()
  return !!session
}