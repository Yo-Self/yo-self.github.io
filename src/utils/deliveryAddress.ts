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

  let result = numberTrimmed ? `${streetTrimmed}, ${numberTrimmed}` : streetTrimmed;
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
      (results, status) => {
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
