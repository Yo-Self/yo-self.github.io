import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  // Manifest padrão para export estático
  return {
    name: 'Restaurant App',
    short_name: 'Restaurant',
    description: 'Aplicativo de restaurante com cardápio digital e pedidos',
    start_url: '/',
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
        purpose: 'any'
      },
      {
        src: '/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/favicon.ico',
        sizes: '48x48',
        type: 'image/x-icon'
      }
    ]
  }
}
