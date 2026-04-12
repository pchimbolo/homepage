import { existsSync } from "fs";
import { join } from "path";

import { CONF_DIR } from "utils/config/config";

const CONFIG_FILES = [
  { name: "services.yaml", label: "Services", description: "Service groups, links, and widgets" },
  { name: "bookmarks.yaml", label: "Bookmarks", description: "Bookmark groups and links" },
  { name: "widgets.yaml", label: "Widgets", description: "Information widgets (search, datetime, resources)" },
  { name: "settings.yaml", label: "Settings", description: "Global settings and providers" },
  { name: "proxmox.yaml", label: "Proxmox", description: "Proxmox node connections" },
  { name: "docker.yaml", label: "Docker", description: "Docker socket configuration" },
  { name: "kubernetes.yaml", label: "Kubernetes", description: "Kubernetes cluster configuration" },
];

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const files = CONFIG_FILES.map((f) => ({
    ...f,
    exists: existsSync(join(CONF_DIR, f.name)),
  }));

  return res.status(200).json(files);
}
