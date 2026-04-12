const fields = [
  { key: "title", label: "Page Title", type: "text", placeholder: "Homepage" },
  { key: "description", label: "Page Description", type: "text" },
  { key: "theme", label: "Theme", type: "select", options: ["dark", "light"] },
  { key: "color", label: "Color", type: "select", options: ["slate", "gray", "zinc", "neutral", "stone", "red", "orange", "amber", "yellow", "lime", "green", "emerald", "teal", "cyan", "sky", "blue", "indigo", "violet", "purple", "fuchsia", "pink", "rose", "white"] },
  { key: "headerStyle", label: "Header Style", type: "select", options: ["boxed", "underlined", "clean", "boxedWidgets"] },
  { key: "language", label: "Language", type: "text", placeholder: "en" },
  { key: "favicon", label: "Favicon URL", type: "url" },
  { key: "hideVersion", label: "Hide Version", type: "boolean" },
  { key: "disableCollapse", label: "Disable Collapse", type: "boolean" },
  { key: "fullWidth", label: "Full Width", type: "boolean" },
  { key: "fiveColumns", label: "Five Columns", type: "boolean" },
  { key: "disableIndexing", label: "Disable Search Indexing", type: "boolean" },
];

const providerFields = [
  { key: "providers.openweathermap", label: "OpenWeatherMap API Key", type: "text" },
  { key: "providers.weatherapi", label: "WeatherAPI Key", type: "text" },
];

export default {
  type: "keyValue",
  label: "Settings",
  fields: [...fields, ...providerFields],
};
