import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { EdgeLogger } from './lib/logging/EdgeLogger'

const secret = new TextEncoder().encode('microfinance-secret-key-change-in-production')

export async function middleware(request: NextRequest) {
  const start = Date.now()
  const { pathname } = request.nextUrl

  // Générer un request ID pour traçabilité
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Public paths that don't require authentication
  const publicPaths = ['/login', '/api/auth/login']
  
  // Check if the path is public
  if (publicPaths.some(path => pathname.startsWith(path))) {
    const response = NextResponse.next()
    response.headers.set('X-Request-ID', requestId)
    
    // Log des accès aux pages publiques
    if (pathname.startsWith('/api/')) {
      const duration = Date.now() - start
      EdgeLogger.logApiRequest(request.method, pathname, 200, duration, { requestId })
    }
    
    return response
  }

  // Check for authentication token
  const token = request.cookies.get('microfinance-session')?.value

  if (!token) {
    // Log tentative d'accès non autorisé
    EdgeLogger.logUserAction('anonymous', 'unauthorized_access_attempt', 'protected_route', {
      pathname: pathname,
      ip: request.ip || request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent'),
      requestId
    })
    
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    // Verify the token
    const { payload } = await jwtVerify(token, secret)
    const userId = payload.userId as string
    
    const response = NextResponse.next()
    response.headers.set('X-Request-ID', requestId)
    response.headers.set('X-User-ID', userId)
    
    // Log des requêtes authentifiées
    if (pathname.startsWith('/api/')) {
      const duration = Date.now() - start
      EdgeLogger.logApiRequest(request.method, pathname, 200, duration, { requestId, userId })
      
      // Log spécifique pour actions sensibles
      if (pathname.includes('/transactions') || pathname.includes('/commissions') || pathname.includes('/clients')) {
        EdgeLogger.logUserAction(userId, 'api_access', pathname, {
          method: request.method,
          endpoint: pathname,
          requestId
        })
      }
    }
    
    return response
  } catch (error) {
    // Token is invalid, redirect to login
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('microfinance-session')
    
    // Log échec d'authentification
    EdgeLogger.logError(error as Error, {
      module: 'auth',
      operation: 'token_verification',
      pathname: pathname,
      requestId
    })
    
    return response
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}