// Serves the brand-icon catalog for the config editor's icon picker.
//
// Fetches the Dashboard Icons project's tree.json server-side, builds a searchable
// catalog (see utils/config-editor/icon-catalog), and caches it in memory so the
// upstream CDN is touched at most once per TTL regardless of how often the picker opens.
// The network is only hit when someone actually opens the picker.

import createLogger from "utils/logger";
import { ICON_BASE, TREE_URL, buildIconCatalog } from "utils/config-editor/icon-catalog";

const logger = createLogger("config-editor-icons");
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // refresh at most once a day

let cache = null; // { icons, fetchedAt }

async function loadCatalog() {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.icons;
  }

  const res = await fetch(TREE_URL, { headers: { "User-Agent": "homepage-config-editor" } });
  if (!res.ok) {
    throw new Error(`tree.json fetch failed: ${res.status} ${res.statusText}`);
  }
  const tree = await res.json();
  const icons = buildIconCatalog(tree);
  if (!icons.length) {
    throw new Error("tree.json contained no icons");
  }
  cache = { icons, fetchedAt: Date.now() };
  return icons;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const icons = await loadCatalog();
    // Let the browser cache the (large) catalog for the session.
    res.setHeader("Cache-Control", "private, max-age=3600");
    return res.status(200).json({ iconBase: ICON_BASE, count: icons.length, icons });
  } catch (e) {
    logger.error("Failed to load icon catalog: %s", e.message);
    // Serve a stale cache if we have one, rather than failing the picker entirely.
    if (cache) {
      return res.status(200).json({ iconBase: ICON_BASE, count: cache.icons.length, icons: cache.icons, stale: true });
    }
    return res.status(502).json({ error: "Could not load icon catalog", details: e.message });
  }
}
