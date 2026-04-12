import { readFileSync, writeFileSync, copyFileSync, existsSync } from "fs";
import { join } from "path";

import { CONF_DIR } from "utils/config/config";

const ALLOWED_FILES = [
  "services.yaml",
  "bookmarks.yaml",
  "widgets.yaml",
  "settings.yaml",
  "proxmox.yaml",
  "docker.yaml",
  "kubernetes.yaml",
];

export default async function handler(req, res) {
  const { file } = req.query;

  if (!ALLOWED_FILES.includes(file)) {
    return res.status(400).json({ error: `File not allowed: ${file}` });
  }

  const filePath = join(CONF_DIR, file);

  if (req.method === "GET") {
    try {
      if (!existsSync(filePath)) {
        return res.status(200).send("");
      }
      const content = readFileSync(filePath, "utf8");
      res.setHeader("Content-Type", "text/yaml");
      return res.status(200).send(content);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method === "PUT") {
    try {
      const { content } = req.body;

      if (typeof content !== "string") {
        return res.status(400).json({ error: "Content must be a string" });
      }

      // Validate YAML syntax
      const { parse } = await import("yaml");
      try {
        parse(content);
      } catch (parseError) {
        return res.status(400).json({
          error: "Invalid YAML syntax",
          details: parseError.message,
          line: parseError.linePos?.[0]?.line,
          col: parseError.linePos?.[0]?.col,
        });
      }

      // Create backup
      if (existsSync(filePath)) {
        copyFileSync(filePath, `${filePath}.bak`);
      }

      // Write the new content
      writeFileSync(filePath, content, "utf8");

      return res.status(200).json({ success: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method === "DELETE") {
    // Restore from backup
    const backupPath = `${filePath}.bak`;
    if (existsSync(backupPath)) {
      copyFileSync(backupPath, filePath);
      return res.status(200).json({ success: true, message: "Restored from backup" });
    }
    return res.status(404).json({ error: "No backup found" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
