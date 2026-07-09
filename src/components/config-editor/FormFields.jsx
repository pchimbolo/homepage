import { useState } from "react";
import dynamic from "next/dynamic";
import { MdImageSearch } from "react-icons/md";
import { resolveIconUrl } from "utils/config-editor/icon-url";

const IconPicker = dynamic(() => import("./IconPicker"), { ssr: false });

export function IconField({ label, value, onChange, placeholder }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const previewUrl = resolveIconUrl(value);

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-neutral-400">{label}</label>
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded bg-neutral-800 border border-neutral-700">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt=""
              className="h-6 w-6 object-contain"
              onError={(e) => {
                e.currentTarget.style.visibility = "hidden";
              }}
            />
          ) : (
            <MdImageSearch className="h-4 w-4 text-neutral-600" />
          )}
        </span>
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "plex.png, sh-foo, or https://…"}
          className="min-w-0 flex-1 rounded-md border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm text-neutral-100 placeholder-neutral-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="flex flex-shrink-0 items-center gap-1 rounded-md border border-neutral-600 bg-neutral-700 px-2.5 py-1.5 text-xs text-neutral-200 hover:bg-neutral-600"
          title="Browse icon library"
        >
          <MdImageSearch className="h-4 w-4" />
          Browse
        </button>
      </div>
      {pickerOpen && (
        <IconPicker
          initialQuery=""
          onSelect={(url) => onChange(url)}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}

export function TextField({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-neutral-400">{label}</label>
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-neutral-800 border border-neutral-700 rounded-md px-3 py-1.5 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  );
}

export function SelectField({ label, value, onChange, options }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-neutral-400">{label}</label>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="bg-neutral-800 border border-neutral-700 rounded-md px-3 py-1.5 text-sm text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">-- Select --</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

export function BooleanField({ label, value, onChange }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <input
        type="checkbox"
        checked={value === true || value === "true"}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded bg-neutral-800 border-neutral-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
      />
      <label className="text-xs font-medium text-neutral-400">{label}</label>
    </div>
  );
}

export function NumberField({ label, value, onChange, placeholder }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-neutral-400">{label}</label>
      <input
        type="number"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
        placeholder={placeholder}
        className="bg-neutral-800 border border-neutral-700 rounded-md px-3 py-1.5 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  );
}

export function renderField(field, value, onChange) {
  switch (field.type) {
    case "icon":
      return (
        <IconField key={field.key} label={field.label} value={value} onChange={onChange} placeholder={field.placeholder} />
      );
    case "boolean":
      return <BooleanField key={field.key} label={field.label} value={value} onChange={onChange} />;
    case "select":
      return (
        <SelectField key={field.key} label={field.label} value={value} onChange={onChange} options={field.options} />
      );
    case "number":
      return (
        <NumberField key={field.key} label={field.label} value={value} onChange={onChange} placeholder={field.placeholder} />
      );
    case "password":
      return (
        <TextField key={field.key} label={field.label} value={value} onChange={onChange} type="password" placeholder={field.placeholder} />
      );
    default:
      return (
        <TextField
          key={field.key}
          label={field.label}
          value={value}
          onChange={onChange}
          placeholder={field.placeholder}
          type={field.type === "url" ? "url" : "text"}
        />
      );
  }
}
