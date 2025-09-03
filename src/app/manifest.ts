import { MetadataRoute } from 'next'
import { headers } from 'next/headers'

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || '/'
  
  // Verificar se estamos em uma página de restaurante
  const restaurantMatch = pathname.match(/^\/restaurant\/([^\/]+)/)
  
  if (restaurantMatch) {
    const slug = restaurantMatch[1]
    const restaurantName = slug
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .trim()
    
    return {
      name: restaurantName,
      short_name: restaurantName,
      description: `Cardápio digital de ${restaurantName}`,
      start_url: `/restaurant/${slug}?utm_source=web_app_manifest`,
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#000000',
      orientation: 'portrait-primary',
      scope: '/',
      lang: 'pt-BR',
      categories: ['food', 'lifestyle', 'utilities'],
      prefer_related_applications: false,
      icons: [
        {
          src: '/favicon-16x16.png',
          sizes: '16x16',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: '/favicon-32x32.png',
          sizes: '32x32',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: '/apple-touch-icon.png',
          sizes: '180x180',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: '/favicon.ico',
          sizes: '48x48',
          type: 'image/x-icon'
        }
      ]
    }
  }
  
  // Manifest padrão para outras páginas
  return {
    name: 'Restaurant App',
    short_name: 'Restaurant',
    description: 'Aplicativo de restaurante com cardápio digital e pedidos',
    start_url: '/?utm_source=web_app_manifest',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    orientation: 'portrait-primary',
    scope: '/',
    lang: 'pt-BR',
    categories: ['food', 'lifestyle', 'utilities'],
    prefer_related_applications: false,
    icons: [
      {
        src: '/favicon-16x16.png',
        sizes: '16x16',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: '/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: '/favicon.ico',
        sizes: '48x48',
        type: 'image/x-icon'
      }
    ]
  }
}
