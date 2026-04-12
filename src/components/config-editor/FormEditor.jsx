import { useState, useCallback, useRef, useEffect } from "react";
import { stringify, parse } from "yaml";
import { MdAdd, MdDelete, MdExpandMore, MdExpandLess, MdDragIndicator } from "react-icons/md";
import { renderField } from "./FormFields";
import schemas from "utils/config-editor/schemas";

// Get nested value from object using dot-notation key
function getNestedValue(obj, key) {
  return key.split(".").reduce((o, k) => o?.[k], obj);
}

// Set nested value in object using dot-notation key
function setNestedValue(obj, key, value) {
  const result = { ...obj };
  const keys = key.split(".");
  let current = result;
  for (let i = 0; i < keys.length - 1; i++) {
    current[keys[i]] = { ...(current[keys[i]] || {}) };
    current = current[keys[i]];
  }
  if (value === "" || value === undefined) {
    delete current[keys[keys.length - 1]];
  } else {
    current[keys[keys.length - 1]] = value;
  }
  return result;
}

function safeArray(val) {
  return Array.isArray(val) ? val : [];
}

// Parse YAML for services format
function parseServicesYaml(yamlContent) {
  if (!yamlContent) return [];
  const data = parse(yamlContent);
  if (!Array.isArray(data)) return [];

  return data.map((group) => {
    const groupName = Object.keys(group)[0];
    const items = safeArray(group[groupName]);
    return {
      name: groupName,
      items: items.map((item) => {
        const itemName = Object.keys(item)[0];
        return { name: itemName, ...(item[itemName] || {}) };
      }),
    };
  });
}

function serializeServicesYaml(groups) {
  const data = safeArray(groups).map((group) => ({
    [group.name]: safeArray(group.items).map((item) => {
      const { name, ...rest } = item;
      return { [name]: rest };
    }),
  }));
  return `---\n${stringify(data, { lineWidth: 0 })}`;
}

// Parse bookmarks
function parseBookmarksYaml(yamlContent) {
  if (!yamlContent) return [];
  const data = parse(yamlContent);
  if (!Array.isArray(data)) return [];

  return data.map((group) => {
    const groupName = Object.keys(group)[0];
    const items = safeArray(group[groupName]);
    return {
      name: groupName,
      items: items.map((item) => {
        const itemName = Object.keys(item)[0];
        const props = Array.isArray(item[itemName]) ? item[itemName][0] || {} : item[itemName] || {};
        return { name: itemName, ...props };
      }),
    };
  });
}

function serializeBookmarksYaml(groups) {
  const data = safeArray(groups).map((group) => ({
    [group.name]: safeArray(group.items).map((item) => {
      const { name, ...rest } = item;
      return { [name]: [rest] };
    }),
  }));
  return `---\n${stringify(data, { lineWidth: 0 })}`;
}

// Parse widgets
function parseWidgetsYaml(yamlContent) {
  if (!yamlContent) return [];
  const data = parse(yamlContent);
  if (!Array.isArray(data)) return [];

  return data.map((widget) => {
    const type = Object.keys(widget)[0];
    const config = widget[type] || {};
    if (typeof config === "boolean") return { type, enabled: config };
    if (typeof config !== "object") return { type };
    return { type, ...config };
  });
}

function serializeWidgetsYaml(widgets) {
  const data = safeArray(widgets).map((widget) => {
    const { type, ...config } = widget;
    const hasConfig = Object.keys(config).length > 0;
    return { [type]: hasConfig ? config : true };
  });
  return `---\n${stringify(data, { lineWidth: 0 })}`;
}

// Parse key-value configs (settings, kubernetes)
function parseKeyValueYaml(yamlContent) {
  if (!yamlContent) return {};
  const result = parse(yamlContent);
  if (!result || typeof result !== "object" || Array.isArray(result)) return {};
  return result;
}

function serializeKeyValueYaml(data) {
  return `---\n${stringify(data || {}, { lineWidth: 0 })}`;
}

// Parse named objects (proxmox, docker)
function parseNamedObjectsYaml(yamlContent) {
  if (!yamlContent) return [];
  const data = parse(yamlContent);
  if (!data || typeof data !== "object" || Array.isArray(data)) return [];
  return Object.entries(data).map(([name, config]) => ({
    name,
    ...(typeof config === "object" && config !== null ? config : {}),
  }));
}

function serializeNamedObjectsYaml(items) {
  const data = {};
  safeArray(items).forEach((item) => {
    const { name, ...config } = item;
    data[name] = config;
  });
  return `---\n${stringify(data, { lineWidth: 0 })}`;
}

function parseForSchema(schema, yamlContent) {
  if (schema?.type === "groupedItems" && schema.bookmarkStyle) {
    return parseBookmarksYaml(yamlContent);
  }
  if (schema?.type === "groupedItems") {
    return parseServicesYaml(yamlContent);
  }
  if (schema?.type === "widgetList") {
    return parseWidgetsYaml(yamlContent);
  }
  if (schema?.type === "namedObjects") {
    return parseNamedObjectsYaml(yamlContent);
  }
  if (schema?.type === "keyValue") {
    return parseKeyValueYaml(yamlContent);
  }
  return null;
}

function serializeForSchema(schema, data) {
  if (schema?.type === "groupedItems" && schema.bookmarkStyle) {
    return serializeBookmarksYaml(data);
  }
  if (schema?.type === "groupedItems") {
    return serializeServicesYaml(data);
  }
  if (schema?.type === "widgetList") {
    return serializeWidgetsYaml(data);
  }
  if (schema?.type === "namedObjects") {
    return serializeNamedObjectsYaml(data);
  }
  if (schema?.type === "keyValue") {
    return serializeKeyValueYaml(data);
  }
  return null;
}

// Collapsible section wrapper
function CollapsibleSection({ title, defaultOpen = true, onDelete, children }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-neutral-700 rounded-lg overflow-hidden">
      <div
        className="flex items-center justify-between px-3 py-2 bg-neutral-800 cursor-pointer hover:bg-neutral-750"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2">
          <MdDragIndicator className="text-neutral-500 w-4 h-4" />
          {open ? (
            <MdExpandLess className="text-neutral-400 w-5 h-5" />
          ) : (
            <MdExpandMore className="text-neutral-400 w-5 h-5" />
          )}
          <span className="text-sm font-medium text-neutral-200">{title}</span>
        </div>
        {onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-red-400 hover:text-red-300 p-1"
            title="Delete"
          >
            <MdDelete className="w-4 h-4" />
          </button>
        )}
      </div>
      {open && <div className="p-3 space-y-3">{children}</div>}
    </div>
  );
}

function AddButton({ label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 px-3 py-1.5 border border-dashed border-neutral-700 rounded-md hover:border-blue-500 transition-colors"
    >
      <MdAdd className="w-4 h-4" />
      {label}
    </button>
  );
}

// Grouped items editor (services, bookmarks)
function GroupedItemsEditor({ data, schema, onChange }) {
  const groups = safeArray(data);

  const updateGroup = (groupIdx, updatedGroup) => {
    const newData = [...groups];
    newData[groupIdx] = updatedGroup;
    onChange(newData);
  };

  const addGroup = () => {
    onChange([...groups, { name: "New Group", items: [] }]);
  };

  const deleteGroup = (groupIdx) => {
    onChange(groups.filter((_, i) => i !== groupIdx));
  };

  const addItem = (groupIdx) => {
    const newData = [...groups];
    newData[groupIdx] = {
      ...newData[groupIdx],
      items: [...safeArray(newData[groupIdx].items), { name: `New ${schema.itemLabel}` }],
    };
    onChange(newData);
  };

  const updateItem = (groupIdx, itemIdx, updatedItem) => {
    const newData = [...groups];
    const newItems = [...safeArray(newData[groupIdx].items)];
    newItems[itemIdx] = updatedItem;
    newData[groupIdx] = { ...newData[groupIdx], items: newItems };
    onChange(newData);
  };

  const deleteItem = (groupIdx, itemIdx) => {
    const newData = [...groups];
    newData[groupIdx] = {
      ...newData[groupIdx],
      items: safeArray(newData[groupIdx].items).filter((_, i) => i !== itemIdx),
    };
    onChange(newData);
  };

  return (
    <div className="space-y-4">
      {groups.map((group, groupIdx) => (
        <CollapsibleSection
          key={groupIdx}
          title={group?.name || `Group ${groupIdx + 1}`}
          onDelete={() => deleteGroup(groupIdx)}
        >
          <div className="mb-3">
            <label className="text-xs font-medium text-neutral-400">Group Name</label>
            <input
              type="text"
              value={group?.name || ""}
              onChange={(e) => updateGroup(groupIdx, { ...group, name: e.target.value })}
              className="w-full mt-1 bg-neutral-800 border border-neutral-700 rounded-md px-3 py-1.5 text-sm text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-3 ml-2">
            {safeArray(group?.items).map((item, itemIdx) => (
              <CollapsibleSection
                key={itemIdx}
                title={item?.name || `${schema.itemLabel} ${itemIdx + 1}`}
                defaultOpen={false}
                onDelete={() => deleteItem(groupIdx, itemIdx)}
              >
                <div className="mb-2">
                  <label className="text-xs font-medium text-neutral-400">{schema.itemLabel} Name</label>
                  <input
                    type="text"
                    value={item?.name || ""}
                    onChange={(e) => updateItem(groupIdx, itemIdx, { ...item, name: e.target.value })}
                    className="w-full mt-1 bg-neutral-800 border border-neutral-700 rounded-md px-3 py-1.5 text-sm text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {item?.icon && (
                  <div className="flex items-center gap-2 mb-2">
                    <img
                      src={item.icon}
                      alt=""
                      className="w-6 h-6 rounded"
                      onError={(e) => { e.target.style.display = "none"; }}
                    />
                    <span className="text-xs text-neutral-500">Icon preview</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {safeArray(schema.fields).map((field) =>
                    renderField(field, item?.[field.key], (val) =>
                      updateItem(groupIdx, itemIdx, { ...item, [field.key]: val }),
                    ),
                  )}
                </div>

                {safeArray(schema.nestedObjects).map((nested) => (
                  <div key={nested.key} className="mt-3">
                    <CollapsibleSection
                      title={nested.label}
                      defaultOpen={!!item?.[nested.key]}
                    >
                      {!item?.[nested.key] ? (
                        <AddButton
                          label={`Add ${nested.label}`}
                          onClick={() =>
                            updateItem(groupIdx, itemIdx, { ...item, [nested.key]: {} })
                          }
                        />
                      ) : (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {safeArray(nested.fields).map((field) =>
                              renderField(field, item[nested.key]?.[field.key], (val) =>
                                updateItem(groupIdx, itemIdx, {
                                  ...item,
                                  [nested.key]: { ...item[nested.key], [field.key]: val },
                                }),
                              ),
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newItem = { ...item };
                              delete newItem[nested.key];
                              updateItem(groupIdx, itemIdx, newItem);
                            }}
                            className="mt-2 text-xs text-red-400 hover:text-red-300"
                          >
                            Remove {nested.label}
                          </button>
                        </>
                      )}
                    </CollapsibleSection>
                  </div>
                ))}
              </CollapsibleSection>
            ))}
            <AddButton label={`Add ${schema.itemLabel}`} onClick={() => addItem(groupIdx)} />
          </div>
        </CollapsibleSection>
      ))}
      <AddButton label="Add Group" onClick={addGroup} />
    </div>
  );
}

// Widget list editor
function WidgetListEditor({ data, schema, onChange }) {
  const widgets = safeArray(data);

  const usedTypes = new Set(widgets.map((w) => w?.type));
  const availableTypes = Object.keys(schema.widgetTypes || {});
  const nextType = availableTypes.find((t) => !usedTypes.has(t)) || availableTypes[0] || "resources";

  const addWidget = () => {
    onChange([...widgets, { type: nextType }]);
  };

  const deleteWidget = (idx) => {
    onChange(widgets.filter((_, i) => i !== idx));
  };

  const updateWidget = (idx, updated) => {
    const newData = [...widgets];
    newData[idx] = updated;
    onChange(newData);
  };

  return (
    <div className="space-y-4">
      {widgets.map((widget, idx) => {
        const typeFields = safeArray(schema.widgetTypes?.[widget?.type]);
        const isEmpty = Object.keys(widget || {}).filter((k) => k !== "type").length === 0;
        return (
          <CollapsibleSection
            key={idx}
            title={`${widget?.type || "unknown"} widget`}
            defaultOpen={isEmpty}
            onDelete={() => deleteWidget(idx)}
          >
            <div className="mb-3">
              <label className="text-xs font-medium text-neutral-400">Widget Type</label>
              <select
                value={widget?.type || ""}
                onChange={(e) => updateWidget(idx, { type: e.target.value })}
                className="w-full mt-1 bg-neutral-800 border border-neutral-700 rounded-md px-3 py-1.5 text-sm text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {Object.keys(schema.widgetTypes || {}).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {typeFields.map((field) =>
                renderField(field, getNestedValue(widget, field.key), (val) =>
                  updateWidget(idx, setNestedValue(widget, field.key, val)),
                ),
              )}
            </div>
          </CollapsibleSection>
        );
      })}
      <AddButton label="Add Widget" onClick={addWidget} />
    </div>
  );
}

// Key-value editor (settings, kubernetes)
function KeyValueEditor({ data, schema, onChange }) {
  const obj = (data && typeof data === "object" && !Array.isArray(data)) ? data : {};
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {safeArray(schema.fields).map((field) =>
          renderField(field, getNestedValue(obj, field.key), (val) =>
            onChange(setNestedValue(obj, field.key, val)),
          ),
        )}
      </div>
    </div>
  );
}

// Named objects editor (proxmox, docker)
function NamedObjectsEditor({ data, schema, onChange }) {
  const items = safeArray(data);

  const addItem = () => {
    onChange([...items, { name: `new-${schema.itemLabel.toLowerCase()}` }]);
  };

  const deleteItem = (idx) => {
    onChange(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx, updated) => {
    const newData = [...items];
    newData[idx] = updated;
    onChange(newData);
  };

  return (
    <div className="space-y-4">
      {items.map((item, idx) => (
        <CollapsibleSection
          key={idx}
          title={item?.name || `${schema.itemLabel} ${idx + 1}`}
          onDelete={() => deleteItem(idx)}
        >
          <div className="mb-3">
            <label className="text-xs font-medium text-neutral-400">{schema.itemLabel} Name</label>
            <input
              type="text"
              value={item?.name || ""}
              onChange={(e) => updateItem(idx, { ...item, name: e.target.value })}
              className="w-full mt-1 bg-neutral-800 border border-neutral-700 rounded-md px-3 py-1.5 text-sm text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {safeArray(schema.fields).map((field) =>
              renderField(field, item?.[field.key], (val) =>
                updateItem(idx, { ...item, [field.key]: val }),
              ),
            )}
          </div>
        </CollapsibleSection>
      ))}
      <AddButton label={`Add ${schema.itemLabel}`} onClick={addItem} />
    </div>
  );
}

function Loading() {
  return (
    <div className="flex items-center justify-center h-full text-neutral-500">
      <p>Loading...</p>
    </div>
  );
}

export default function FormEditor({ fileName, yamlContent, onYamlChange }) {
  const schema = schemas[fileName];
  const [formData, setFormData] = useState(null);
  const currentFileRef = useRef(fileName);

  // When file changes, reset and track current file
  useEffect(() => {
    currentFileRef.current = fileName;
    setFormData(null);
  }, [fileName]);

  // Parse YAML into form data when content changes
  useEffect(() => {
    if (!yamlContent || !schema) return;
    // Ignore if this parse is for a stale file
    if (currentFileRef.current !== fileName) return;

    try {
      const parsed = parseForSchema(schema, yamlContent);
      if (parsed !== null) {
        setFormData(parsed);
      }
    } catch {
      // If parsing fails, don't update
    }
  }, [yamlContent, schema, fileName]);

  const handleFormChange = useCallback(
    (newData) => {
      setFormData(newData);
      const yaml = serializeForSchema(schema, newData);
      if (yaml) {
        onYamlChange(yaml);
      }
    },
    [schema, onYamlChange],
  );

  if (!schema || formData === null) {
    return <Loading />;
  }

  // Validate data type matches what the schema expects before rendering
  const expectsArray = schema.type === "groupedItems" || schema.type === "widgetList" || schema.type === "namedObjects";
  const expectsObject = schema.type === "keyValue";

  if (expectsArray && !Array.isArray(formData)) {
    return <Loading />;
  }
  if (expectsObject && (typeof formData !== "object" || Array.isArray(formData))) {
    return <Loading />;
  }

  return (
    <div className="h-full overflow-auto p-4">
      {schema.type === "groupedItems" && (
        <GroupedItemsEditor data={formData} schema={schema} onChange={handleFormChange} />
      )}
      {schema.type === "widgetList" && (
        <WidgetListEditor data={formData} schema={schema} onChange={handleFormChange} />
      )}
      {schema.type === "keyValue" && (
        <KeyValueEditor data={formData} schema={schema} onChange={handleFormChange} />
      )}
      {schema.type === "namedObjects" && (
        <NamedObjectsEditor data={formData} schema={schema} onChange={handleFormChange} />
      )}
    </div>
  );
}
