// Builds a searchable brand-icon catalog from the Dashboard Icons project
// (github.com/homarr-labs/dashboard-icons). Ported from the Sentinel project's
// site/scripts/generate-manifest.js — one entry per icon, display names derived
// from the slug, with a hand-tuned overlay for popular brands' names/aliases/colors.

export const ICON_BASE = "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/";
export const TREE_URL = "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/tree.json";

// Words that should be upper-cased (or specially cased) rather than title-cased.
const ACRONYMS = new Map(
  Object.entries({
    aws: "AWS", ai: "AI", api: "API", cdn: "CDN", ci: "CI", cd: "CD", crm: "CRM", css: "CSS",
    db: "DB", dns: "DNS", ftp: "FTP", hp: "HP", html: "HTML", http: "HTTP", https: "HTTPS",
    ibm: "IBM", id: "ID", io: "IO", ios: "iOS", ip: "IP", js: "JS", mfa: "MFA", npm: "npm",
    nas: "NAS", os: "OS", otp: "OTP", pdf: "PDF", php: "PHP", pc: "PC", rss: "RSS", sap: "SAP",
    sdk: "SDK", seo: "SEO", sql: "SQL", sso: "SSO", tv: "TV", ui: "UI", url: "URL", ux: "UX",
    vm: "VM", vpn: "VPN", "2fa": "2FA", "3cx": "3CX",
  }),
);

// Hand-tuned metadata layered on top of the auto-generated entries, keyed by slug.
// Aliases let a search like "aws" surface the Amazon tile.
const OVERLAY = {
  microsoft: { name: "Microsoft", color: "#0078D4", aliases: ["microsoft 365", "office 365", "outlook", "azure", "entra", "onedrive", "xbox"] },
  google: { name: "Google", color: "#4285F4", aliases: ["gmail", "google workspace", "gsuite", "youtube"] },
  apple: { name: "Apple", color: "#000000", aliases: ["icloud", "apple id"] },
  amazon: { name: "Amazon", color: "#FF9900", aliases: ["aws", "amazon web services"] },
  github: { name: "GitHub", color: "#181717", aliases: ["gh"] },
  gitlab: { name: "GitLab", color: "#FC6D26", aliases: [] },
  adobe: { name: "Adobe", color: "#FF0000", aliases: ["creative cloud", "acrobat", "photoshop"] },
  slack: { name: "Slack", color: "#4A154B", aliases: [] },
  discord: { name: "Discord", color: "#5865F2", aliases: [] },
  dropbox: { name: "Dropbox", color: "#0061FF", aliases: [] },
  facebook: { name: "Facebook", color: "#1877F2", aliases: ["meta"] },
  instagram: { name: "Instagram", color: "#E4405F", aliases: [] },
  twitter: { name: "X (Twitter)", color: "#000000", aliases: ["x", "twitter"] },
  linkedin: { name: "LinkedIn", color: "#0A66C2", aliases: [] },
  paypal: { name: "PayPal", color: "#003087", aliases: [] },
  twitch: { name: "Twitch", color: "#9146FF", aliases: [] },
  steam: { name: "Steam", color: "#1B2838", aliases: ["valve"] },
  reddit: { name: "Reddit", color: "#FF4500", aliases: [] },
  "proton-mail": { name: "Proton Mail", color: "#6D4AFF", aliases: ["proton", "protonmail", "protonvpn"] },
  bitwarden: { name: "Bitwarden", color: "#175DDC", aliases: [] },
  "1password": { name: "1Password", color: "#0A2D4D", aliases: ["onepassword"] },
  okta: { name: "Okta", color: "#007DC1", aliases: [] },
  wordpress: { name: "WordPress", color: "#21759B", aliases: ["wp"] },
  cloudflare: { name: "Cloudflare", color: "#F38020", aliases: [] },
  // A few self-hosted staples that benefit from aliases.
  plex: { name: "Plex", color: "#E5A00D", aliases: ["media server"] },
  jellyfin: { name: "Jellyfin", color: "#00A4DC", aliases: ["media server"] },
  "home-assistant": { name: "Home Assistant", color: "#18BCF2", aliases: ["hass", "homeassistant"] },
  proxmox: { name: "Proxmox", color: "#E57000", aliases: ["pve", "proxmox ve"] },
  portainer: { name: "Portainer", color: "#13BEF9", aliases: ["docker"] },
};

// "github-dark" -> "GitHub (dark)", "actual-budget" -> "Actual Budget"
function deriveName(slug) {
  let base = slug;
  let variant = "";
  if (base.endsWith("-dark")) {
    variant = " (dark)";
    base = base.slice(0, -5);
  } else if (base.endsWith("-light")) {
    variant = " (light)";
    base = base.slice(0, -6);
  }
  const titled = base
    .split("-")
    .map((w) => (ACRONYMS.has(w) ? ACRONYMS.get(w) : w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
  return titled + variant;
}

// Turn a Dashboard Icons tree.json ({ png: [...], svg: [...], webp: [...] }) into
// a sorted list of catalog entries. PNG has full coverage, so we index that set.
export function buildIconCatalog(tree) {
  const pngs = Array.isArray(tree?.png) ? tree.png : [];
  return pngs
    .filter((f) => typeof f === "string" && f.endsWith(".png"))
    .map((f) => {
      const slug = f.slice(0, -4);
      const ov = OVERLAY[slug] ?? {};
      const entry = { slug, name: ov.name ?? deriveName(slug), aliases: ov.aliases ?? [] };
      if (ov.color) entry.color = ov.color;
      return entry;
    })
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

// Case-insensitive client-side search over name, slug, and aliases (ported from Sentinel),
// with light relevance ranking so exact and prefix matches sort ahead of mid-word substring
// hits (e.g. "plex" surfaces Plex before Perplexity). Ties keep the alphabetical slug order.
export function searchIcons(all, query) {
  if (!query || !query.trim()) return all;
  const q = query.trim().toLowerCase();

  const rank = (ic) => {
    const name = ic.name.toLowerCase();
    const aliases = (ic.aliases || []).map((a) => a.toLowerCase());
    if (ic.slug === q || name === q || aliases.includes(q)) return 0; // exact
    if (ic.slug.startsWith(q) || name.startsWith(q) || aliases.some((a) => a.startsWith(q))) return 1; // prefix
    if (ic.slug.includes(q) || name.includes(q) || aliases.some((a) => a.includes(q))) return 2; // substring
    return -1; // no match
  };

  return all
    .map((ic) => ({ ic, r: rank(ic) }))
    .filter((x) => x.r >= 0)
    .sort((a, b) => a.r - b.r || a.ic.slug.localeCompare(b.ic.slug))
    .map((x) => x.ic);
}
