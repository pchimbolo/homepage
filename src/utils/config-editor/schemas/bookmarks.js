const bookmarkFields = [
  { key: "icon", label: "Icon", type: "url", placeholder: "https://example.com/icon.png" },
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
