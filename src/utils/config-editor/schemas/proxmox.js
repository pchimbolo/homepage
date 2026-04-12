const nodeFields = [
  { key: "url", label: "URL", type: "url", placeholder: "https://192.168.1.250:8006" },
  { key: "token", label: "API Token", type: "text", placeholder: "user@pam!tokenid" },
  { key: "secret", label: "API Secret", type: "password" },
  { key: "insecureSkipVerify", label: "Skip TLS Verify", type: "boolean" },
];

export default {
  type: "namedObjects",
  label: "Proxmox Nodes",
  itemLabel: "Node",
  fields: nodeFields,
};
