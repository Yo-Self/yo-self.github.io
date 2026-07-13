import { Coordinates } from './distanceCalculator';

export function buildFullDeliveryAddress(
  street: string,
  number?: string | null,
  complement?: string | null
): string {
  const streetTrimmed = (street || '').trim();
  if (!streetTrimmed) return '';

  const numberTrimmed = (number || '').trim();
  const complementTrimmed = (complement || '').trim();

  let result: string;
  if (!numberTrimmed) {
    result = streetTrimmed;
  } else if (streetTrimmed.includes(',')) {
    // Google formatted address: insert number after street name (first segment).
    // Appending at the end breaks server geocoding (Nominatim).
    const commaIdx = streetTrimmed.indexOf(',');
    const streetName = streetTrimmed.slice(0, commaIdx).trim();
    const rest = streetTrimmed.slice(commaIdx + 1).trim();
    result = `${streetName}, ${numberTrimmed}, ${rest}`;
  } else {
    result = `${streetTrimmed}, ${numberTrimmed}`;
  }

  if (complementTrimmed) {
    result += ` - ${complementTrimmed}`;
  }
  return result;
}

function waitForGoogleGeocoder(timeoutMs = 5000): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.google?.maps?.Geocoder) return Promise.resolve(true);

  return new Promise((resolve) => {
    const startedAt = Date.now();
    const interval = window.setInterval(() => {
      if (window.google?.maps?.Geocoder) {
        window.clearInterval(interval);
        resolve(true);
        return;
      }
      if (Date.now() - startedAt >= timeoutMs) {
        window.clearInterval(interval);
        resolve(false);
      }
    }, 100);
  });
}

export async function geocodeDeliveryAddress(address: string): Promise<Coordinates | null> {
  const query = address.trim();
  if (!query) return null;

  const ready = await waitForGoogleGeocoder();
  if (!ready || !window.google?.maps?.Geocoder) return null;

  const geocoder = new window.google.maps.Geocoder();

  return new Promise((resolve) => {
    geocoder.geocode(
      { address: query, componentRestrictions: { country: 'br' } },
      (results: any, status: any) => {
        if (status !== 'OK' || !results?.[0]?.geometry?.location) {
          resolve(null);
          return;
        }

        const location = results[0].geometry.location;
        resolve({
          latitude: location.lat(),
          longitude: location.lng(),
        });
      }
    );
  });
}
