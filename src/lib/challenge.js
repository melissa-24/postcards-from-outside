// Challenge links: the hunt travels in the URL hash, e.g.
//   https://…/#challenge=red-leaf.squirrel.cloud&from=Melissa
// Browsers never send the part after "#" to the server, so the link works
// with no backend and the server never sees what's in it.
import { ITEMS } from "../data/items.js";

const SEP = "."; // item ids are kebab-case, and "." survives URL encoding unchanged
const MAX_ITEMS = 8;

// Build the link to share. `from` is optional (the names on the postcard, or nothing).
export function challengeUrl(items, from) {
  const params = new URLSearchParams({ challenge: items.map((item) => item.id).join(SEP) });
  if (from) params.set("from", from);
  return `${location.origin}${location.pathname}#${params}`;
}

// Read a challenge from the current URL. Returns { items, from } or null.
// Unknown ids are skipped, so an old link still works if an item was renamed or removed.
export function readChallenge(hash = location.hash) {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const ids = params.get("challenge")?.split(SEP) ?? [];
  const items = [...new Set(ids)]
    .map((id) => ITEMS.find((item) => item.id === id))
    .filter(Boolean)
    .slice(0, MAX_ITEMS);
  if (!items.length) return null;
  return { items, from: params.get("from") || null };
}

// Remove the challenge from the address bar (e.g. after "Start a hunt" of their own),
// without reloading or adding a history entry.
export function clearChallenge() {
  history.replaceState(null, "", location.pathname + location.search);
}
