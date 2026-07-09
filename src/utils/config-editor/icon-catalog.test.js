import { describe, expect, it } from "vitest";

import { ICON_BASE, buildIconCatalog, searchIcons } from "./icon-catalog";

const tree = {
  png: ["plex.png", "perplexity.png", "amazon.png", "aws.png", "github-dark.png", "actual-budget.png", "1password.png"],
  svg: [],
  webp: [],
};

describe("buildIconCatalog", () => {
  const catalog = buildIconCatalog(tree);

  it("indexes the png set, sorted by slug", () => {
    expect(catalog.map((c) => c.slug)).toEqual([
      "1password",
      "actual-budget",
      "amazon",
      "aws",
      "github-dark",
      "perplexity",
      "plex",
    ]);
  });

  it("derives display names from slugs (title-case, variant suffix)", () => {
    expect(catalog.find((c) => c.slug === "actual-budget").name).toBe("Actual Budget");
    // No overlay entry for this slug, so each word is plain title-cased and the variant is suffixed.
    expect(catalog.find((c) => c.slug === "github-dark").name).toBe("Github (dark)");
  });

  it("applies the overlay for names, aliases, and colors", () => {
    const onePw = catalog.find((c) => c.slug === "1password");
    expect(onePw.name).toBe("1Password");
    expect(onePw.aliases).toContain("onepassword");
    expect(onePw.color).toBe("#0A2D4D");
  });

  it("exposes the jsDelivr png base", () => {
    expect(ICON_BASE).toBe("https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/");
  });
});

describe("searchIcons", () => {
  const catalog = buildIconCatalog(tree);

  it("returns everything for an empty query", () => {
    expect(searchIcons(catalog, "").length).toBe(catalog.length);
  });

  it("ranks exact/prefix matches ahead of mid-word substrings", () => {
    // 'plex' matches both plex (prefix) and perplexity (substring); plex must come first.
    expect(searchIcons(catalog, "plex")[0].slug).toBe("plex");
  });

  it("matches via aliases (aws -> amazon)", () => {
    expect(searchIcons(catalog, "aws")[0].slug).toBe("amazon");
  });

  it("is case-insensitive", () => {
    expect(searchIcons(catalog, "GITHUB")[0].slug).toBe("github-dark");
  });
});
