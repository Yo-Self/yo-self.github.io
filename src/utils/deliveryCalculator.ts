import { calculateDistance, Coordinates } from './distanceCalculator';

export interface DeliveryZone {
  id: string;
  name: string;
  type: 'exclusion' | 'special_fee';
  fee: number; // em centavos
  shape: 'circle' | 'polygon';
  center?: { lat: number; lng: number };
  radius?: number; // em metros
  coordinates?: Array<{ lat: number; lng: number }>;
}

export interface DeliveryCalculationResult {
  covered: boolean;
  fee: number; // em centavos (R$)
  reason?: 'delivery_disabled' | 'waiting_location' | 'missing_coordinates' | 'distance_exceeded' | 'exclusion_zone' | 'no_restaurant_coords';
  zoneName?: string;
  distanceKm?: number;
}

/**
 * Verifica se um ponto geográfico está dentro de um polígono usando o algoritmo de Ray-Casting
 */
export function isPointInPolygon(point: Coordinates, polygon: Array<{ lat: number; lng: number }>): boolean {
  const x = point.latitude;
  const y = point.longitude;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lat;
    const yi = polygon[i].lng;
    const xj = polygon[j].lat;
    const yj = polygon[j].lng;

    const intersect = ((yi > y) !== (yj > y))
        && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
    
    if (intersect) {
      inside = !inside;
    }
  }

  return inside;
}

/**
 * Verifica se um ponto geográfico está dentro de um círculo
 */
export function isPointInCircle(point: Coordinates, center: { lat: number; lng: number }, radiusMeters: number): boolean {
  const distance = calculateDistance(point, { latitude: center.lat, longitude: center.lng });
  const distanceMeters = distance.distanceKm * 1000;
  return distanceMeters <= radiusMeters;
}

/**
 * Calcula a taxa de entrega e verifica a cobertura do endereço do cliente
 */
export function calculateDeliveryFeeAndCoverage(
  restaurant: any,
  customerCoords: Coordinates | null
): DeliveryCalculationResult {
  // 1. Verificar se o delivery está ativo
  if (!restaurant || restaurant.delivery_enabled === false) {
    return {
      covered: false,
      fee: 0,
      reason: 'delivery_disabled'
    };
  }

  // 2. Sem coordenadas do cliente — não permitir checkout de entrega
  if (!customerCoords) {
    return {
      covered: false,
      fee: 0,
      reason: 'missing_coordinates'
    };
  }

  // 3. Verificar se o restaurante tem coordenadas cadastradas
  const restLat = Number(restaurant.latitude);
  const restLng = Number(restaurant.longitude);

  if (!restLat || !restLng || isNaN(restLat) || isNaN(restLng)) {
    console.warn('⚠️ Restaurante sem coordenadas geográficas válidas:', restaurant);
    return {
      covered: true, // assume coberto para não travar vendas se o restaurante esqueceu as coordenadas
      fee: Number(restaurant.delivery_base_fee) || 0,
      reason: 'no_restaurant_coords'
    };
  }

  const restaurantCoords: Coordinates = {
    latitude: restLat,
    longitude: restLng
  };

  // 4. Calcular distância em quilômetros
  const distanceResult = calculateDistance(restaurantCoords, customerCoords);
  const d = distanceResult.distanceKm;

  // 5. Verificar distância máxima
  const maxDistance = Number(restaurant.delivery_max_distance) || 10.0;
  if (d > maxDistance) {
    return {
      covered: false,
      fee: 0,
      reason: 'distance_exceeded',
      distanceKm: d
    };
  }

  // 6. Verificar zonas de entrega customizadas
  const zones: DeliveryZone[] = restaurant.delivery_zones || [];
  
  for (const zone of zones) {
    let isInside = false;

    if (zone.shape === 'circle' && zone.center && zone.radius) {
      isInside = isPointInCircle(customerCoords, zone.center, zone.radius);
    } else if (zone.shape === 'polygon' && zone.coordinates && zone.coordinates.length > 0) {
      isInside = isPointInPolygon(customerCoords, zone.coordinates);
    }

    if (isInside) {
      if (zone.type === 'exclusion') {
        return {
          covered: false,
          fee: 0,
          reason: 'exclusion_zone',
          zoneName: zone.name,
          distanceKm: d
        };
      } else if (zone.type === 'special_fee') {
        return {
          covered: true,
          fee: zone.fee || 0,
          zoneName: zone.name,
          distanceKm: d
        };
      }
    }
  }

  // 7. Cálculo padrão baseado na distância
  const baseFee = Number(restaurant.delivery_base_fee) || 0; // em centavos
  const feePerKm = Number(restaurant.delivery_fee_per_km) || 0; // em centavos
  const finalFee = baseFee + d * feePerKm;

  return {
    covered: true,
    fee: Math.round(finalFee),
    distanceKm: d
  };
}
