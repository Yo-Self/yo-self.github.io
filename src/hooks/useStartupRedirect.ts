import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useStandaloneMode } from '@/hooks/useStandaloneMode';
import { useCurrentRoute } from '@/hooks/useCurrentRoute';

const STORAGE_KEY = 'lastRestaurantSlug';

export function useStartupRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const { isStandalone } = useStandaloneMode();
  const { isRestaurantPage, currentRoute } = useCurrentRoute();

  // Sempre salvar o último restaurante visitado
  useEffect(() => {
    if (isRestaurantPage) {
      const slug = currentRoute.split('/')[2];
      if (slug) {
        try {
          localStorage.setItem(STORAGE_KEY, slug);
        } catch {}
      }
    }
  }, [isRestaurantPage, currentRoute]);

  // No modo standalone, se abrir na home "/", redirecionar para o último restaurante
  useEffect(() => {
    if (!isStandalone) return;
    if (pathname === '/') {
      try {
        const lastSlug = localStorage.getItem(STORAGE_KEY);
        if (lastSlug) {
          router.replace(`/restaurant/${lastSlug}`);
        }
      } catch {}
    }
  }, [isStandalone, pathname, router]);
}
