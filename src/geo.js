// Géocodage via Nominatim (OpenStreetMap) - gratuit, sans clé API
export async function geocodeAddress(query) {
  if (!query || !query.trim()) return null;
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
    query
  )}`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error('Géocodage impossible');
  const data = await res.json();
  if (!data || data.length === 0) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), label: data[0].display_name };
}

// Distance et durée du trajet routier via OSRM (Open Source Routing Machine) - gratuit, sans clé API
export async function routeDistanceKm(from, to) {
  if (!from || !to) return null;
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=false`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Calcul de trajet impossible');
  const data = await res.json();
  if (!data.routes || data.routes.length === 0) return null;
  return {
    distanceKm: data.routes[0].distance / 1000,
    dureeMin: data.routes[0].duration / 60,
  };
}
