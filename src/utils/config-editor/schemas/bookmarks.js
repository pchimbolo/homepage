const bookmarkFields = [
  { key: "icon", label: "Icon", type: "icon", placeholder: "plex.png, sh-foo, or https://…" },
  { key: "href", label: "URL", type: "url", placeholder: "https://example.com" },
  { key: "target", label: "Target", type: "select", options: ["_self", "_blank"] },
];

export default {
  type: "groupedItems",
  label: "Bookmarks",
  itemLabel: "Bookmark",
  fields: bookmarkFields,
  nestedObjects: [],
  // Bookmarks use a different structure: each item is { Name: [{ icon, href, target }] }
  bookmarkStyle: true,
};
