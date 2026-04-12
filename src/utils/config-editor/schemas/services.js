const serviceFields = [
  { key: "icon", label: "Icon", type: "url", placeholder: "https://example.com/icon.png" },
  { key: "href", label: "URL", type: "url", placeholder: "https://example.com" },
  { key: "description", label: "Description", type: "text", placeholder: "Service description" },
  { key: "target", label: "Target", type: "select", options: ["_self", "_blank"] },
  { key: "proxmoxNode", label: "Proxmox Node", type: "text", placeholder: "pve" },
  { key: "proxmoxVMID", label: "Proxmox VM ID", type: "number", placeholder: "100" },
];

const widgetFields = [
  { key: "type", label: "Widget Type", type: "text", placeholder: "proxmox" },
  { key: "url", label: "Widget URL", type: "url", placeholder: "https://192.168.1.250:8006" },
  { key: "username", label: "Username", type: "text", placeholder: "user@pam!token" },
  { key: "password", label: "Password/Secret", type: "password" },
  { key: "node", label: "Node", type: "text", placeholder: "pve" },
  { key: "insecureSkipVerify", label: "Skip TLS Verify", type: "boolean" },
];

export default {
  type: "groupedItems",
  label: "Services",
  itemLabel: "Service",
  fields: serviceFields,
  nestedObjects: [{ key: "widget", label: "Widget", fields: widgetFields }],
};
