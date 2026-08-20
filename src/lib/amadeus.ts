/**
 * Amadeus Hotel Search client.
 * Uses the Amadeus Self-Service API (test environment).
 * Falls back to the cached response when DEMO_USE_CACHE=true or when API fails.
 *
 * Amadeus API docs: https://developers.amadeus.com/self-service/apis-docs/guides/developer-guides/resources/hotels/
 */

import type { HotelCandidate, Provenance } from '@/types';
import { AMADEUS_CACHE } from '@/data/fixtures';

interface AmadeusTokenResponse {
  access_token: string;
  expires_in: number;
}

interface AmadeusHotelOffer {
  hotel: {
    hotelId: string;
    name: string;
    address?: { lines?: string[]; cityName?: string };
    amenities?: string[];
    accessibility?: {
      wheelchairAccessibleEntrance?: boolean;
      elevator?: boolean;
    };
  };
  offers: Array<{
    id: string;
    price: { total: string; currency: string };
    room: { description?: { text?: string } };
    policies?: { paymentType?: string };
  }>;
  available: boolean;
}

let _tokenCache: { token: string; expiresAt: number } | null = null;

async function getAmadeusToken(): Promise<string> {
  if (_tokenCache && Date.now() < _tokenCache.expiresAt - 10_000) {
    return _tokenCache.token;
  }

  const { AMADEUS_CLIENT_ID, AMADEUS_CLIENT_SECRET } = process.env;
  if (!AMADEUS_CLIENT_ID || !AMADEUS_CLIENT_SECRET) {
    throw new Error('Amadeus credentials not configured');
  }

  const resp = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: AMADEUS_CLIENT_ID,
      client_secret: AMADEUS_CLIENT_SECRET,
    }),
  });

  if (!resp.ok) throw new Error(`Amadeus auth failed: ${resp.status}`);
  const data: AmadeusTokenResponse = await resp.json();
  _tokenCache = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return data.access_token;
}

function normalizeCandidate(offer: AmadeusHotelOffer, retrievedAt: string): HotelCandidate {
  const h = offer.hotel;
  const firstOffer = offer.offers?.[0];
  const pricePerNight = firstOffer?.price.total
    ? parseFloat(firstOffer.price.total) / 2 // 2-night stay
    : 0;

  const amenities = (h.amenities ?? []).map((a) => a.toUpperCase());
  const hasElevator = (amenities.includes('ELEVATOR') || h.accessibility?.elevator) ?? null;
  const hasStepFree = (amenities.includes('ACCESSIBLE_ENTRANCES') || h.accessibility?.wheelchairAccessibleEntrance) ?? null;

  return {
    id: h.hotelId.toLowerCase(),
    name: h.name,
    nightlyPrice: pricePerNight,
    currency: firstOffer?.price.currency ?? 'USD',
    roomsAvailable: 4, // Test API doesn't return exact room count; assume 4 available
    elevator: typeof hasElevator === 'boolean' ? hasElevator : null,
    wheelchairAccessibleEntrance: typeof hasStepFree === 'boolean' ? hasStepFree : null,
    rollInShower: null, // Never inferred — must be confirmed
    parkingCostPerNight: null,
    address: [h.address?.lines?.[0], h.address?.cityName].filter(Boolean).join(', '),
    available: offer.available,
    provenance: 'LIVE_API',
    retrievedAt,
  };
}

export async function searchHotels(cityCode: string = 'SAN'): Promise<{
  candidates: HotelCandidate[];
  provenance: Provenance;
  retrievedAt: string;
}> {
  const useCache = process.env.DEMO_USE_CACHE === 'true';

  if (!useCache && process.env.AMADEUS_CLIENT_ID) {
    try {
      const token = await getAmadeusToken();
      const retrievedAt = new Date().toISOString();

      // Step 1: Get hotel IDs for the city
      const listResp = await fetch(
        `https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-city?cityCode=${cityCode}&radius=5&radiusUnit=KM&hotelSource=ALL`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!listResp.ok) throw new Error(`Hotel list failed: ${listResp.status}`);
      const listData = await listResp.json();
      const hotelIds: string[] = (listData.data ?? []).slice(0, 10).map((h: { hotelId: string }) => h.hotelId);

      if (hotelIds.length === 0) throw new Error('No hotels returned from city search');

      // Step 2: Get offers for those hotels
      const checkIn = '2026-09-18';
      const checkOut = '2026-09-20';
      const params = new URLSearchParams({
        hotelIds: hotelIds.join(','),
        checkInDate: checkIn,
        checkOutDate: checkOut,
        adults: '2',
        roomQuantity: '4',
        currency: 'USD',
        bestRateOnly: 'true',
      });

      const offersResp = await fetch(
        `https://test.api.amadeus.com/v3/shopping/hotel-offers?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!offersResp.ok) throw new Error(`Hotel offers failed: ${offersResp.status}`);
      const offersData = await offersResp.json();

      const candidates = (offersData.data ?? [])
        .slice(0, 5)
        .map((offer: AmadeusHotelOffer) => normalizeCandidate(offer, retrievedAt));

      return { candidates, provenance: 'LIVE_API', retrievedAt };
    } catch (err) {
      console.warn('[Amadeus] Live search failed, using cache:', err);
    }
  }

  // Return cached response (labeled correctly)
  const retrievedAt = AMADEUS_CACHE.retrievedAt;
  const candidates = AMADEUS_CACHE.candidates.map((c) => ({
    ...c,
    provenance: 'CACHED_API_RESPONSE' as Provenance,
    retrievedAt,
  }));

  return { candidates, provenance: 'CACHED_API_RESPONSE', retrievedAt };
}
