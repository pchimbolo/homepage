const fields = [
  { key: "mode", label: "Mode", type: "select", options: ["default", "cluster", "disabled"] },
  { key: "kubeconfig", label: "Kubeconfig Path", type: "text", placeholder: "/path/to/kubeconfig" },
];

export default {
  type: "keyValue",
  label: "Kubernetes",
  fields,
};
