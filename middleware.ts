import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Adicionar o pathname como header para o manifest poder detectar a rota
  response.headers.set('x-pathname', request.nextUrl.pathname)
  
  // Log para debug
  if (request.nextUrl.pathname.includes('manifest')) {
    console.log('Middleware: Processing manifest request for path:', request.nextUrl.pathname)
  }
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
    '/manifest.webmanifest',
    '/manifest.json',
  ],
}
