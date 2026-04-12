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
