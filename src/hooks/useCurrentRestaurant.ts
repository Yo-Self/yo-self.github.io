import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function useCurrentRestaurant() {
  const [restaurantId, setRestaurantId] = useState<string | undefined>();
  const pathname = usePathname();

  useEffect(() => {
    // Extrair o ID do restaurante da URL
    // Formato esperado: /restaurant/[slug] ou /restaurant/entry?id=...
    if (pathname.startsWith('/restaurant/')) {
      const segments = pathname.split('/');
      if (segments.length >= 3) {
        const slug = segments[2];
        
        // Se for a página de entrada com ID na query string
        if (slug === 'entry') {
          // Tentar extrair o ID da query string se disponível
          if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            const id = urlParams.get('id');
            if (id) {
              setRestaurantId(id);
              return;
            }
          }
        }
        
        // Para outras páginas, usar o slug como identificador
        // O hook useWhatsAppConfig irá buscar a configuração correta no banco
        setRestaurantId(slug);
      }
    } else {
      setRestaurantId(undefined);
    }
  }, [pathname]);

  return restaurantId;
}
