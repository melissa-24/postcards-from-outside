// Optional location → rough region band, via OpenStreetMap's Nominatim.
// Usage policy: https://operations.osmfoundation.org/policies/nominatim/
// - One request at a time, at least 1 s apart.
// - Results (including "not found") are cached on the device, so each place is looked up once.
// - The app is identified by the browser's Referer header; scripts can't set
//   User-Agent in a browser. No email or other personal info is sent.

const ENDPOINT = "https://nominatim.openstreetmap.org/search";
const CACHE_KEY = "postcards.regionCache";
const MIN_GAP_MS = 1000;

// Rough latitude bands: an honest approximation of growing zones, not a precise map.
export function regionForLatitude(lat) {
  if (lat < 31) return "south";
  if (lat <= 39) return "middle";
  return "north";
}

// localStorage can throw (private mode, storage full), so caching is best-effort.
function readCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY)) ?? {};
  } catch {
    return {};
  }
}
function saveToCache(key, result) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ...readCache(), [key]: result }));
  } catch {
    // no cache this time; the lookup still worked
  }
}

let queue = Promise.resolve(); // chains lookups so only one request is ever in flight
let lastRequestAt = 0;

/**
 * Look up a typed city/state or zip code.
 * Resolves with { region, latitude, name } or null if nothing matched.
 * Rejects if the request fails (e.g. no signal); the caller can offer "Skip".
 */
export function lookupRegion(place) {
  const key = place.trim().toLowerCase().replace(/\s+/g, " ");
  if (!key) return Promise.resolve(null);

  const cache = readCache();
  if (key in cache) return Promise.resolve(cache[key]);

  const result = queue.then(() => fetchRegion(key));
  queue = result.catch(() => {}); // a failed lookup shouldn't block the next one
  return result;
}

async function fetchRegion(key) {
  // An earlier lookup in the queue may have cached this same place.
  const cache = readCache();
  if (key in cache) return cache[key];

  const wait = lastRequestAt + MIN_GAP_MS - Date.now();
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  lastRequestAt = Date.now();

  // US only: the latitude bands (and the item list) are written for the US.
  const params = new URLSearchParams({ q: key, format: "jsonv2", limit: "1", countrycodes: "us" });
  const res = await fetch(`${ENDPOINT}?${params}`, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`Location lookup failed (${res.status})`);

  const [hit] = await res.json();
  const result = hit
    ? { region: regionForLatitude(Number(hit.lat)), latitude: Number(hit.lat), name: hit.display_name }
    : null;
  saveToCache(key, result);
  return result;
}
