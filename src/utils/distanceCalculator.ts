/**
 * Utilitário para cálculo de distância entre coordenadas geográficas
 * Usa a fórmula de Haversine para calcular a distância em linha reta entre dois pontos
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface DistanceResult {
  distanceKm: number;
  distanceMeters: number;
  formattedDistance: string;
}

/**
 * Calcula a distância entre dois pontos geográficos usando a fórmula de Haversine
 * @param point1 Primeiro ponto (ex: restaurante)
 * @param point2 Segundo ponto (ex: cliente)
 * @returns Objeto com distância em km, metros e formato legível
 */
export function calculateDistance(point1: Coordinates, point2: Coordinates): DistanceResult {
  const R = 6371; // Raio da Terra em quilômetros
  const dLat = toRadians(point2.latitude - point1.latitude);
  const dLon = toRadians(point2.longitude - point1.longitude);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.latitude)) * Math.cos(toRadians(point2.latitude)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = R * c;
  const distanceMeters = distanceKm * 1000;
  
  return {
    distanceKm,
    distanceMeters,
    formattedDistance: formatDistance(distanceKm)
  };
}

/**
 * Converte graus para radianos
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Formata a distância de forma legível
 * @param distanceKm Distância em quilômetros
 * @returns String formatada (ex: "2.5 km", "850 m")
 */
function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} m`;
  } else if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)} km`;
  } else {
    return `${Math.round(distanceKm)} km`;
  }
}

/**
 * Valida se as coordenadas são válidas
 * @param coordinates Coordenadas para validar
 * @returns true se válidas, false caso contrário
 */
export function isValidCoordinates(coordinates: Coordinates): boolean {
  return (
    typeof coordinates.latitude === 'number' &&
    typeof coordinates.longitude === 'number' &&
    !isNaN(coordinates.latitude) &&
    !isNaN(coordinates.longitude) &&
    coordinates.latitude >= -90 &&
    coordinates.latitude <= 90 &&
    coordinates.longitude >= -180 &&
    coordinates.longitude <= 180
  );
}

/**
 * Calcula a distância entre restaurante e cliente se ambos tiverem coordenadas válidas
 * @param restaurantCoords Coordenadas do restaurante
 * @param customerCoords Coordenadas do cliente
 * @returns Resultado da distância ou null se não for possível calcular
 */
export function calculateDeliveryDistance(
  restaurantCoords: Coordinates | null,
  customerCoords: Coordinates | null
): DistanceResult | null {
  if (!restaurantCoords || !customerCoords) {
    return null;
  }
  
  if (!isValidCoordinates(restaurantCoords) || !isValidCoordinates(customerCoords)) {
    return null;
  }
  
  return calculateDistance(restaurantCoords, customerCoords);
}
