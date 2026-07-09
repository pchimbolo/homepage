import { describe, expect, it } from "vitest";

import { resolveIconUrl } from "./icon-url";

describe("resolveIconUrl", () => {
  it("returns null for empty/invalid input", () => {
    expect(resolveIconUrl("")).toBeNull();
    expect(resolveIconUrl("   ")).toBeNull();
    expect(resolveIconUrl(null)).toBeNull();
    expect(resolveIconUrl(undefined)).toBeNull();
  });

  it("passes through absolute and site-relative URLs", () => {
    expect(resolveIconUrl("https://x.com/i.png")).toBe("https://x.com/i.png");
    expect(resolveIconUrl("http://x.com/i.png")).toBe("http://x.com/i.png");
    expect(resolveIconUrl("/icons/local.png")).toBe("/icons/local.png");
  });

  it("resolves Dashboard Icons bare names by extension (default png)", () => {
    const base = "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons";
    expect(resolveIconUrl("plex")).toBe(`${base}/png/plex.png`);
    expect(resolveIconUrl("plex.png")).toBe(`${base}/png/plex.png`);
    expect(resolveIconUrl("plex.svg")).toBe(`${base}/svg/plex.svg`);
    expect(resolveIconUrl("grafana.webp")).toBe(`${base}/webp/grafana.webp`);
  });

  it("resolves selfh.st (sh-) icons with the right extension", () => {
    expect(resolveIconUrl("sh-foo")).toBe("https://cdn.jsdelivr.net/gh/selfhst/icons@main/png/foo.png");
    expect(resolveIconUrl("sh-bar.svg")).toBe("https://cdn.jsdelivr.net/gh/selfhst/icons@main/svg/bar.svg");
  });

  it("resolves simple-icons and mdi tokens, stripping optional hex color", () => {
    expect(resolveIconUrl("si-github")).toBe("https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/github.svg");
    expect(resolveIconUrl("mdi-server")).toBe("https://cdn.jsdelivr.net/npm/@mdi/svg@latest/svg/server.svg");
    expect(resolveIconUrl("mdi-server-ff0000")).toBe("https://cdn.jsdelivr.net/npm/@mdi/svg@latest/svg/server.svg");
  });
});
