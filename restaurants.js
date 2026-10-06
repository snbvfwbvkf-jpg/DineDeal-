const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1563379091339-03246963d96c?auto=format&fit=crop&w=900&q=80'
];

function distanceKm(aLat, aLng, bLat, bLng) {
  const R = 6371;
  const dLat = (bLat - aLat) * Math.PI / 180;
  const dLng = (bLng - aLng) * Math.PI / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * Math.PI / 180) * Math.cos(bLat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return +(R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))).toFixed(1);
}

function priceFromLevel(level) {
  return ({ PRICE_LEVEL_FREE: 0, PRICE_LEVEL_INEXPENSIVE: 250, PRICE_LEVEL_MODERATE: 500, PRICE_LEVEL_EXPENSIVE: 1000, PRICE_LEVEL_VERY_EXPENSIVE: 1800 }[level] ?? 500);
}

function mapPlace(p, userLat, userLng, index) {
  const loc = p.location || {};
  const lat = loc.latitude;
  const lng = loc.longitude;
  const types = p.types || [];
  const isCafe = types.includes('cafe') || p.primaryType === 'cafe';
  return {
    id: p.id || `google-${index}`,
    googlePlaceId: p.id || null,
    name: p.displayName?.text || 'Restaurant',
    type: isCafe ? 'cafe' : 'restaurant',
    cuisine: isCafe ? 'Cafe' : 'Restaurant',
    rating: Number(p.rating || 0),
    discount: 0,
    price: priceFromLevel(p.priceLevel),
    distance: Number.isFinite(lat) && Number.isFinite(lng) ? distanceKm(userLat, userLng, lat, lng) : 0,
    veg: false,
    tag: 'Google listing',
    desc: p.formattedAddress || 'Local place found with Google Places',
    img: FALLBACK_IMAGES[index % FALLBACK_IMAGES.length],
    lat, lng,
    address: p.formattedAddress || ''
  };
}

async function placesRequest(url, body) {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) throw new Error('GOOGLE_PLACES_API_KEY is not configured');
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.types,places.primaryType,places.rating,places.priceLevel,places.formattedAddress,places.location'
    },
    body: JSON.stringify(body)
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error?.message || `Google Places error ${r.status}`);
  return data;
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const q = String(req.query.q || '').trim();
  const radius = Math.min(Math.max(Number(req.query.radius || 5000), 100), 50000);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return res.status(400).json({ error: 'Valid lat and lng are required.' });

  try {
    const data = q
      ? await placesRequest('https://places.googleapis.com/v1/places:searchText', {
          textQuery: q,
          locationBias: { circle: { center: { latitude: lat, longitude: lng }, radius } },
          maxResultCount: 20
        })
      : await placesRequest('https://places.googleapis.com/v1/places:searchNearby', {
          includedTypes: ['restaurant', 'cafe'], maxResultCount: 20,
          locationRestriction: { circle: { center: { latitude: lat, longitude: lng }, radius } },
          rankPreference: 'DISTANCE'
        });
    return res.status(200).json({ restaurants: (data.places || []).map((p, i) => mapPlace(p, lat, lng, i)), source: 'google-places-new' });
  } catch (e) {
    return res.status(502).json({ error: e.message });
  }
};
