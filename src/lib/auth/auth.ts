import bcrypt from 'bcryptjs'
import { AUTH_CONFIG } from './config'
import { createSession } from './session'

export async function login(username: string, password: string) {
  // Simple authentication - in production, use hashed passwords from database
  if (username === AUTH_CONFIG.USERNAME && password === AUTH_CONFIG.PASSWORD) {
    await createSession('admin')
    return { success: true }
  }
  
  return { success: false, error: 'Identifiants incorrects' }
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string) {
  return bcrypt.compare(password, hashedPassword)
}