import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { MdClose, MdSearch } from "react-icons/md";
import { searchIcons } from "utils/config-editor/icon-catalog";

// The catalog is ~2,800 entries; render it in batches (endless scroll) so opening the
// picker and typing stays snappy. Ported from Sentinel's IconCatalogWindow.
const INITIAL_BATCH = 120;
const PAGE_BATCH = 80;
const DEBOUNCE_MS = 200;

// Session-level cache so re-opening the picker doesn't re-fetch the catalog.
let catalogCache = null; // { iconBase, icons }
let catalogPromise = null;

async function loadCatalog() {
  if (catalogCache) return catalogCache;
  if (!catalogPromise) {
    catalogPromise = fetch("/api/config-editor/icons")
      .then((res) => {
        if (!res.ok) throw new Error(`Catalog request failed (${res.status})`);
        return res.json();
      })
      .then((data) => {
        catalogCache = { iconBase: data.iconBase, icons: data.icons || [] };
        return catalogCache;
      })
      .catch((err) => {
        catalogPromise = null; // allow a retry on next open
        throw err;
      });
  }
  return catalogPromise;
}

export default function IconPicker({ initialQuery = "", onSelect, onClose }) {
  const [iconBase, setIconBase] = useState("");
  const [icons, setIcons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState(initialQuery);
  const [debounced, setDebounced] = useState(initialQuery);
  const [renderCount, setRenderCount] = useState(INITIAL_BATCH);
  const scrollRef = useRef(null);

  // Load catalog once.
  useEffect(() => {
    let active = true;
    setLoading(true);
    loadCatalog()
      .then((data) => {
        if (!active) return;
        setIconBase(data.iconBase);
        setIcons(data.icons);
        setError("");
      })
      .catch((err) => active && setError(err.message || "Failed to load icons"))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  // Debounce the search box.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  // Reset paging whenever the query changes.
  useEffect(() => {
    setRenderCount(INITIAL_BATCH);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [debounced]);

  // Close on Escape.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const matches = useMemo(() => searchIcons(icons, debounced), [icons, debounced]);
  const visible = matches.slice(0, renderCount);

  const handleScroll = useCallback(
    (e) => {
      const el = e.currentTarget;
      const fromBottom = el.scrollHeight - (el.scrollTop + el.clientHeight);
      if (fromBottom <= el.clientHeight) {
        setRenderCount((c) => (c < matches.length ? c + PAGE_BATCH : c));
      }
    },
    [matches.length],
  );

  const pick = (slug) => {
    onSelect(`${iconBase}${slug}.png`);
    onClose();
  };

  const status = loading
    ? "Loading icon catalog…"
    : error
      ? ""
      : matches.length === 0
        ? "No matching icons — try a different name."
        : visible.length >= matches.length
          ? `${matches.length.toLocaleString()} icon${matches.length === 1 ? "" : "s"}`
          : `Showing ${visible.length.toLocaleString()} of ${matches.length.toLocaleString()} — scroll for more`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex h-[80vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-neutral-700 bg-neutral-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Icon picker"
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-neutral-700 px-4 py-3">
          <div className="relative flex-1">
            <MdSearch className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-500" />
            {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search brand and app icons (e.g. plex, github, aws)…"
              className="w-full rounded-md border border-neutral-700 bg-neutral-800 py-2 pl-10 pr-3 text-sm text-neutral-100 placeholder-neutral-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
            title="Close"
          >
            <MdClose className="h-5 w-5" />
          </button>
        </div>

        {/* Grid */}
        <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-auto p-3">
          {error ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-red-400">
              <p>Couldn&apos;t load the icon catalog.</p>
              <p className="text-xs text-neutral-500">{error}</p>
            </div>
          ) : loading ? (
            <div className="flex h-full items-center justify-center text-sm text-neutral-500">
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-neutral-600 border-t-neutral-300" />
              Loading icon catalog…
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {visible.map((ic) => (
                <button
                  key={ic.slug}
                  type="button"
                  onClick={() => pick(ic.slug)}
                  title={ic.name}
                  className="flex flex-col items-center gap-1.5 rounded-md border border-transparent p-2 text-center hover:border-blue-500/40 hover:bg-neutral-800"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded bg-neutral-800">
                    <img
                      src={`${iconBase}${ic.slug}.png`}
                      alt=""
                      loading="lazy"
                      className="h-10 w-10 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.visibility = "hidden";
                      }}
                    />
                  </span>
                  <span className="w-full truncate text-[11px] leading-tight text-neutral-400">{ic.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between border-t border-neutral-700 px-4 py-2 text-xs text-neutral-500">
          <span>{status}</span>
          <span className="text-neutral-600">Icons from Dashboard Icons</span>
        </div>
      </div>
    </div>
  );
}
