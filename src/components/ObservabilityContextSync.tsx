'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { setObservabilityContext } from '@/lib/observability'

export default function ObservabilityContextSync() {
  const pathname = usePathname()

  useEffect(() => {
    const isRestaurant = pathname.startsWith('/restaurant/')
    const isDelivery = pathname.startsWith('/delivery/')

    if (!isRestaurant && !isDelivery) {
      setObservabilityContext({})
      return
    }

    const segments = pathname.split('/')
    const slug = segments.length >= 3 ? segments[2] : undefined

    if (!slug || slug === 'entry') {
      return
    }

    const isPwa =
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true)

    setObservabilityContext({
      restaurantSlug: slug,
      restaurantId: slug,
      deliveryMode: isDelivery ? 'delivery' : 'dine_in',
      isPwa,
    })
  }, [pathname])

  return null
}
