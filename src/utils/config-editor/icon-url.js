// Resolve an icon value (as stored in the YAML) into a plain browser-loadable URL
// for previews inside the config editor. Mirrors the resolution logic used by
// Homepage's own <ResolvedIcon> (src/components/resolvedicon.jsx) so what the editor
// previews matches what the dashboard renders.
//
// Supported inputs:
//   - Full URLs / site-relative paths ........ https://…  or  /icons/foo.png
//   - Dashboard Icons (the icon picker) ....... "plex.png" | "plex.svg" | "plex.webp" | "plex"
//   - selfh.st icons .......................... "sh-foo" (.svg/.png/.webp)
//   - Simple Icons / Material Design Icons .... "si-github" | "mdi-server"
//
// Returns null when there is nothing to show.

const DASHBOARD_ICONS_BASE = "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons";
const MASK_ICON_BASE = {
  mdi: "https://cdn.jsdelivr.net/npm/@mdi/svg@latest/svg/",
  si: "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/",
};

export function resolveIconUrl(icon) {
  if (!icon || typeof icon !== "string") return null;
  const value = icon.trim();
  if (!value) return null;

  // Direct or site-relative URLs
  if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/")) {
    return value;
  }

  // selfh.st icons: sh-<name>[.svg|.png|.webp]
  if (value.startsWith("sh-")) {
    const ext = value.endsWith(".svg") ? "svg" : value.endsWith(".webp") ? "webp" : "png";
    const name = value.replace(/^sh-/, "").replace(/\.(svg|png|webp)$/, "");
    return `https://cdn.jsdelivr.net/gh/selfhst/icons@main/${ext}/${name}.${ext}`;
  }

  // Simple Icons / Material Design Icons: si-<name> / mdi-<name> (monochrome SVGs)
  const prefix = value.split("-")[0];
  if (prefix in MASK_ICON_BASE) {
    // Strip an optional trailing -RRGGBB hex color and any .svg suffix.
    const name = value
      .replace(new RegExp(`^${prefix}-`), "")
      .replace(/\.svg$/, "")
      .replace(/-[0-9a-f]{6}$/i, "");
    return `${MASK_ICON_BASE[prefix]}${name}.svg`;
  }

  // Fallback: Dashboard Icons (homarr-labs). Honour an explicit extension, default to png.
  if (value.endsWith(".svg")) return `${DASHBOARD_ICONS_BASE}/svg/${value.replace(/\.svg$/, "")}.svg`;
  if (value.endsWith(".webp")) return `${DASHBOARD_ICONS_BASE}/webp/${value.replace(/\.webp$/, "")}.webp`;
  return `${DASHBOARD_ICONS_BASE}/png/${value.replace(/\.png$/, "")}.png`;
}

export default resolveIconUrl;
