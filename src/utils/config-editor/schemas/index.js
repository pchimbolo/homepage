import services from "./services";
import bookmarks from "./bookmarks";
import widgets from "./widgets";
import settings from "./settings";
import proxmox from "./proxmox";
import docker from "./docker";
import kubernetes from "./kubernetes";

const schemas = {
  "services.yaml": services,
  "bookmarks.yaml": bookmarks,
  "widgets.yaml": widgets,
  "settings.yaml": settings,
  "proxmox.yaml": proxmox,
  "docker.yaml": docker,
  "kubernetes.yaml": kubernetes,
};

export default schemas;
