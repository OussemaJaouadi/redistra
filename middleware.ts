/**
 * Next.js Middleware - Server-side route protection
 * Runs before ALL requests, verifies JWT and protects routes
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { env } from '@/env'
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  LEGACY_ACCESS_TOKEN_COOKIE,
  LEGACY_REFRESH_TOKEN_COOKIE,
  LEGACY_TOKEN_COOKIE
} from '@/server/lib/auth-cookies'

const JWT_SECRET = new TextEncoder().encode(env.JWT_SECRET)

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/',
  '/connections',
  '/users',
  '/settings',
  '/audit',
  '/keys',
]

// Routes that should redirect to dashboard if authenticated
const AUTH_ROUTES = ['/login']

// Public routes (API endpoints handled separately)
const PUBLIC_ROUTES = ['/api']

async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload
  } catch {
    return null
  }
}

function parseCookieHeader(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {}

  cookieHeader.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.trim().split('=')
    if (name && rest.length > 0) {
      cookies[name] = rest.join('=')
    }
  })

  return cookies
}

function serializeCookies(cookies: Record<string, string>): string {
  return Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join('; ')
}

function getSetCookieHeaders(response: Response): string[] {
  const headers = response.headers as unknown as {
    getSetCookie?: () => string[]
  }

  if (typeof headers.getSetCookie === 'function') {
    return headers.getSetCookie()
  }

  const header = response.headers.get('set-cookie')
  if (!header) {
    return []
  }

  return header
    .split(',')
    .map(value => value.trim())
    .filter(Boolean)
}

function extractCookiePair(setCookie: string): { name: string; value: string } | null {
  const pair = setCookie.split(';')[0]
  const index = pair.indexOf('=')
  if (index <= 0) {
    return null
  }

  return {
    name: pair.slice(0, index).trim(),
    value: pair.slice(index + 1),
  }
}

async function tryRefresh(request: NextRequest): Promise<{
  setCookies: string[]
  requestHeaders?: Headers
}> {
  const cookieHeader = request.headers.get('cookie') || ''
  const cookies = parseCookieHeader(cookieHeader)

  if (!cookies[REFRESH_TOKEN_COOKIE] && !cookies[LEGACY_REFRESH_TOKEN_COOKIE]) {
    return { setCookies: [] }
  }

  const refreshUrl = new URL('/api/auth/refresh', request.url)
  const response = await fetch(refreshUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: cookieHeader,
    },
  })

  const setCookies = getSetCookieHeaders(response)
  if (!response.ok) {
    return { setCookies }
  }

  const nextCookies = { ...cookies }
  for (const setCookie of setCookies) {
    const pair = extractCookiePair(setCookie)
    if (pair) {
      nextCookies[pair.name] = pair.value
    }
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('cookie', serializeCookies(nextCookies))

  return { setCookies, requestHeaders }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Allow public routes
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }
  
  // Get token from cookies
  const token =
    request.cookies.get(ACCESS_TOKEN_COOKIE)?.value ||
    request.cookies.get(LEGACY_ACCESS_TOKEN_COOKIE)?.value ||
    request.cookies.get(LEGACY_TOKEN_COOKIE)?.value
  const payload = token ? await verifyToken(token) : null
  
  // Check if route is protected
  const isProtectedRoute = PROTECTED_ROUTES.some(route => 
    pathname.startsWith(route) || pathname === '/'
  )
  
  // Check if route is auth route
  const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route))
  
  // Redirect unauthenticated users from protected routes to login
  if (isProtectedRoute && !payload) {
    const refreshResult = await tryRefresh(request)
    if (refreshResult.requestHeaders) {
      const response = NextResponse.next({ request: { headers: refreshResult.requestHeaders } })
      for (const setCookie of refreshResult.setCookies) {
        response.headers.append('set-cookie', setCookie)
      }
      return response
    }

    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    const response = NextResponse.redirect(loginUrl)
    for (const setCookie of refreshResult.setCookies) {
      response.headers.append('set-cookie', setCookie)
    }
    return response
  }
  
  // Redirect authenticated users from auth routes to dashboard
  if (isAuthRoute) {
    if (payload) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    const refreshResult = await tryRefresh(request)
    if (refreshResult.setCookies.length > 0) {
      const response = NextResponse.redirect(new URL('/', request.url))
      for (const setCookie of refreshResult.setCookies) {
        response.headers.append('set-cookie', setCookie)
      }
      return response
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
