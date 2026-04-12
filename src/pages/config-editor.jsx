import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Head from "next/head";
import Link from "next/link";
import { MdSave, MdUndo, MdCode, MdViewList, MdArrowBack, MdCheck, MdError, MdRestorePage } from "react-icons/md";

const YamlEditor = dynamic(() => import("components/config-editor/YamlEditor"), { ssr: false });
const FormEditor = dynamic(() => import("components/config-editor/FormEditor"), { ssr: false });

const CONFIG_FILES = [
  { name: "services.yaml", label: "Services", icon: "S" },
  { name: "bookmarks.yaml", label: "Bookmarks", icon: "B" },
  { name: "widgets.yaml", label: "Widgets", icon: "W" },
  { name: "settings.yaml", label: "Settings", icon: "G" },
  { name: "proxmox.yaml", label: "Proxmox", icon: "P" },
  { name: "docker.yaml", label: "Docker", icon: "D" },
  { name: "kubernetes.yaml", label: "K8s", icon: "K" },
];

export default function ConfigEditorPage() {
  const [activeFile, setActiveFile] = useState("services.yaml");
  const [yamlContent, setYamlContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [viewMode, setViewMode] = useState("form"); // "form" or "yaml"
  const [saveStatus, setSaveStatus] = useState(null); // null, "saving", "saved", "error"
  const [errorMessage, setErrorMessage] = useState("");
  const [modified, setModified] = useState({});

  // Load file content
  const loadFile = useCallback(async (fileName) => {
    try {
      const res = await fetch(`/api/config-editor/${fileName}`);
      const text = await res.text();
      setYamlContent(text);
      setOriginalContent(text);
      setSaveStatus(null);
      setErrorMessage("");
    } catch (err) {
      setErrorMessage(`Failed to load ${fileName}: ${err.message}`);
    }
  }, []);

  useEffect(() => {
    // Reset content immediately to prevent stale data with wrong schema
    setYamlContent("");
    setOriginalContent("");
    setSaveStatus(null);
    setErrorMessage("");
    loadFile(activeFile);
  }, [activeFile, loadFile]);

  // Track modifications
  useEffect(() => {
    setModified((prev) => ({
      ...prev,
      [activeFile]: yamlContent !== originalContent,
    }));
  }, [yamlContent, originalContent, activeFile]);

  const handleSave = async () => {
    setSaveStatus("saving");
    setErrorMessage("");

    try {
      const res = await fetch(`/api/config-editor/${activeFile}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: yamlContent }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSaveStatus("saved");
        setOriginalContent(yamlContent);
        setModified((prev) => ({ ...prev, [activeFile]: false }));

        // Trigger Homepage revalidation
        fetch("/api/revalidate").catch(() => {});

        setTimeout(() => setSaveStatus(null), 2000);
      } else {
        setSaveStatus("error");
        setErrorMessage(data.error || data.details || "Failed to save");
      }
    } catch (err) {
      setSaveStatus("error");
      setErrorMessage(err.message);
    }
  };

  const handleRevert = () => {
    setYamlContent(originalContent);
    setSaveStatus(null);
    setErrorMessage("");
  };

  const handleRestore = async () => {
    try {
      const res = await fetch(`/api/config-editor/${activeFile}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (res.ok && data.success) {
        await loadFile(activeFile);
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus(null), 2000);
      } else {
        setErrorMessage(data.error || "No backup found");
      }
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  const hasModifications = modified[activeFile];

  return (
    <>
      <Head>
        <title>Config Editor - Homepage</title>
      </Head>

      <div className="flex h-screen bg-neutral-900 text-neutral-100">
        {/* Sidebar */}
        <div className="w-56 bg-neutral-850 border-r border-neutral-700 flex flex-col" style={{ backgroundColor: "#1a1a2e" }}>
          {/* Header */}
          <div className="p-4 border-b border-neutral-700">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-neutral-400 hover:text-neutral-200 transition-colors mb-3"
            >
              <MdArrowBack className="w-4 h-4" />
              Back to Homepage
            </Link>
            <h1 className="text-lg font-semibold text-neutral-100">Config Editor</h1>
          </div>

          {/* File list */}
          <nav className="flex-1 p-2 space-y-1 overflow-auto">
            {CONFIG_FILES.map((file) => (
              <button
                key={file.name}
                type="button"
                onClick={() => setActiveFile(file.name)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  activeFile === file.name
                    ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                    : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 border border-transparent"
                }`}
              >
                <span
                  className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                    activeFile === file.name ? "bg-blue-600 text-white" : "bg-neutral-700 text-neutral-300"
                  }`}
                >
                  {file.icon}
                </span>
                <span className="flex-1 text-left">{file.label}</span>
                {modified[file.name] && (
                  <span className="w-2 h-2 rounded-full bg-amber-400" title="Modified" />
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-700 bg-neutral-800">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-neutral-300">{activeFile}</span>
              {hasModifications && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                  Modified
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* View mode toggle */}
              <div className="flex rounded-md border border-neutral-600 overflow-hidden mr-2">
                <button
                  type="button"
                  onClick={() => setViewMode("form")}
                  className={`flex items-center gap-1 px-3 py-1.5 text-xs ${
                    viewMode === "form"
                      ? "bg-blue-600 text-white"
                      : "bg-neutral-700 text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  <MdViewList className="w-4 h-4" />
                  Form
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("yaml")}
                  className={`flex items-center gap-1 px-3 py-1.5 text-xs ${
                    viewMode === "yaml"
                      ? "bg-blue-600 text-white"
                      : "bg-neutral-700 text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  <MdCode className="w-4 h-4" />
                  YAML
                </button>
              </div>

              {/* Restore from backup */}
              <button
                type="button"
                onClick={handleRestore}
                className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-md bg-neutral-700 text-neutral-300 hover:bg-neutral-600 transition-colors"
                title="Restore from backup"
              >
                <MdRestorePage className="w-4 h-4" />
                Restore
              </button>

              {/* Revert */}
              <button
                type="button"
                onClick={handleRevert}
                disabled={!hasModifications}
                className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-md bg-neutral-700 text-neutral-300 hover:bg-neutral-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <MdUndo className="w-4 h-4" />
                Revert
              </button>

              {/* Save */}
              <button
                type="button"
                onClick={handleSave}
                disabled={!hasModifications || saveStatus === "saving"}
                className="flex items-center gap-1 px-4 py-1.5 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {saveStatus === "saving" && (
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {saveStatus === "saved" && <MdCheck className="w-4 h-4 text-green-300" />}
                {saveStatus === "error" && <MdError className="w-4 h-4 text-red-300" />}
                {!saveStatus && <MdSave className="w-4 h-4" />}
                {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved!" : "Save"}
              </button>
            </div>
          </div>

          {/* Error bar */}
          {errorMessage && (
            <div className="px-4 py-2 bg-red-900/30 border-b border-red-800 text-red-300 text-sm flex items-center gap-2">
              <MdError className="w-4 h-4 flex-shrink-0" />
              {errorMessage}
              <button
                type="button"
                onClick={() => setErrorMessage("")}
                className="ml-auto text-red-400 hover:text-red-200"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Editor area */}
          <div className="flex-1 min-h-0">
            {viewMode === "yaml" ? (
              <YamlEditor value={yamlContent} onChange={setYamlContent} />
            ) : (
              <FormEditor
                fileName={activeFile}
                yamlContent={yamlContent}
                onYamlChange={setYamlContent}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
