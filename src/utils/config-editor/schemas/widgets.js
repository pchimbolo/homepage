const widgetTypes = {
  resources: [
    { key: "cpu", label: "Show CPU", type: "boolean" },
    { key: "memory", label: "Show Memory", type: "boolean" },
    { key: "disk", label: "Disk Path", type: "text", placeholder: "/" },
  ],
  search: [
    { key: "provider", label: "Provider", type: "select", options: ["google", "duckduckgo", "bing", "brave", "custom"] },
    { key: "target", label: "Target", type: "select", options: ["_self", "_blank"] },
    { key: "url", label: "Custom URL", type: "url", placeholder: "https://search.example.com/?q=" },
  ],
  datetime: [
    { key: "text_size", label: "Text Size", type: "select", options: ["xs", "sm", "md", "lg", "xl", "2xl", "3xl", "4xl"] },
    { key: "format.dateStyle", label: "Date Style", type: "select", options: ["full", "long", "medium", "short"] },
    { key: "format.timeStyle", label: "Time Style", type: "select", options: ["full", "long", "medium", "short"] },
  ],
  logo: [
    { key: "icon", label: "Icon URL", type: "url" },
    { key: "href", label: "Link URL", type: "url" },
    { key: "target", label: "Target", type: "select", options: ["_self", "_blank"] },
    { key: "width", label: "Width", type: "text", placeholder: "32px" },
    { key: "height", label: "Height", type: "text", placeholder: "32px" },
  ],
  openmeteo: [
    { key: "latitude", label: "Latitude", type: "number" },
    { key: "longitude", label: "Longitude", type: "number" },
    { key: "units", label: "Units", type: "select", options: ["metric", "imperial"] },
  ],
};

export default {
  type: "widgetList",
  label: "Widgets",
  widgetTypes,
};
