const fields = [
  { key: "socket", label: "Socket Path", type: "text", placeholder: "/var/run/docker.sock" },
  { key: "host", label: "Host", type: "text", placeholder: "127.0.0.1" },
  { key: "port", label: "Port", type: "number", placeholder: "2375" },
];

export default {
  type: "namedObjects",
  label: "Docker Hosts",
  itemLabel: "Docker Host",
  fields,
};
