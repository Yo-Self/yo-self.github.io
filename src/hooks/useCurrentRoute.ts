import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export function useCurrentRoute() {
  const pathname = usePathname();
  const [currentRoute, setCurrentRoute] = useState(pathname);

  useEffect(() => {
    setCurrentRoute(pathname);
  }, [pathname]);

  // Verificar se está em uma página de restaurante
  const isRestaurantPage = currentRoute.startsWith('/restaurant/');
  
  // Obter nome do restaurante da URL
  const getRestaurantName = () => {
    if (isRestaurantPage) {
      const slug = currentRoute.split('/')[2];
      return slug ? slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : '';
    }
    return '';
  };

  // Obter título da página atual
  const getPageTitle = () => {
    if (isRestaurantPage) {
      const restaurantName = getRestaurantName();
      return restaurantName ? `${restaurantName}` : 'Restaurante';
    }
    
    switch (currentRoute) {
      case '/':
        return 'Home';
      case '/about':
        return 'Sobre';
      case '/organization':
        return 'Organização';
      default:
        return 'Restaurant App';
    }
  };

  return {
    currentRoute,
    isRestaurantPage,
    restaurantName: getRestaurantName(),
    pageTitle: getPageTitle(),
  };
}
