import React from "react";

export function Field({
  name,
  label,
  value = "",
  type = "text",
  required = false,
  dir,
  placeholder,
}: {
  name: string;
  label: string;
  value?: string | number;
  type?: string;
  required?: boolean;
  dir?: "rtl" | "ltr";
  placeholder?: string;
}) {
  const isRtl = dir === "rtl" || name.endsWith("Ar");
  return (
    <label>
      <span style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span>
          {label} {required && <strong style={{ color: "#b91c1c" }}>*</strong>}
        </span>
        <span
          style={{
            fontSize: "10px",
            fontWeight: 700,
            textTransform: "uppercase",
            color: isRtl ? "#9a613d" : "var(--forest)",
            background: isRtl ? "rgba(242,185,133,0.2)" : "rgba(42,69,52,0.08)",
            padding: "2px 6px",
            borderRadius: "4px",
          }}
        >
          {isRtl ? "العربية" : "EN"}
        </span>
      </span>
      <input
        name={name}
        defaultValue={value}
        type={type}
        required={required}
        dir={isRtl ? "rtl" : "ltr"}
        placeholder={placeholder}
        style={{
          fontFamily: isRtl ? '"Noto Kufi Arabic", sans-serif' : 'inherit',
          textAlign: isRtl ? "right" : "left",
        }}
      />
    </label>
  );
}

export function Textarea({
  name,
  label,
  value = "",
  required = false,
  dir,
  rows = 4,
  placeholder,
}: {
  name: string;
  label: string;
  value?: string;
  required?: boolean;
  dir?: "rtl" | "ltr";
  rows?: number;
  placeholder?: string;
}) {
  const isRtl = dir === "rtl" || name.endsWith("Ar");
  return (
    <label>
      <span style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span>
          {label} {required && <strong style={{ color: "#b91c1c" }}>*</strong>}
        </span>
        <span
          style={{
            fontSize: "10px",
            fontWeight: 700,
            textTransform: "uppercase",
            color: isRtl ? "#9a613d" : "var(--forest)",
            background: isRtl ? "rgba(242,185,133,0.2)" : "rgba(42,69,52,0.08)",
            padding: "2px 6px",
            borderRadius: "4px",
          }}
        >
          {isRtl ? "العربية" : "EN"}
        </span>
      </span>
      <textarea
        name={name}
        defaultValue={value}
        required={required}
        rows={rows}
        dir={isRtl ? "rtl" : "ltr"}
        placeholder={placeholder}
        style={{
          fontFamily: isRtl ? '"Noto Kufi Arabic", sans-serif' : 'inherit',
          textAlign: isRtl ? "right" : "left",
        }}
      />
    </label>
  );
}

export function Check({
  name,
  label,
  checked = false,
}: {
  name: string;
  label: string;
  checked?: boolean;
}) {
  return (
    <label className="check" style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
      <input name={name} type="checkbox" defaultChecked={checked} style={{ width: "18px", height: "18px" }} />
      <span style={{ fontSize: "14px", fontWeight: 500 }}>{label}</span>
    </label>
  );
}

export function RgbField({
  name,
  label,
  value = "255, 255, 255",
}: {
  name: string;
  label: string;
  value?: string;
}) {
  return (
    <label>
      {label}
      <span style={{ display: "grid", gridTemplateColumns: "1fr 46px", gap: 10 }}>
        <input name={name} defaultValue={value} inputMode="numeric" placeholder="255, 255, 255" aria-describedby={`${name}-hint`} />
        <i
          style={{
            display: "block",
            border: "1px solid #d9d9d2",
            borderRadius: 8,
            backgroundColor: `rgb(${value})`,
          }}
          aria-hidden="true"
        />
      </span>
      <small id={`${name}-hint`} style={{ color: "#68736d", fontWeight: 400 }}>
        Background RGB — enter three numbers from 0 to 255. White is 255, 255, 255.
      </small>
    </label>
  );
}

export function FontSizeField({
  sectionKey,
  label,
  value,
}: {
  sectionKey: string;
  label: string;
  value?: number;
}) {
  return (
    <label>
      {label}
      <input
        name={`fontSize_${sectionKey}`}
        defaultValue={value ?? ""}
        type="number"
        min="12"
        max="200"
        step="1"
        placeholder="Use design default"
      />
      <small style={{ color: "#68736d", fontWeight: 400 }}>
        Main heading size in pixels (12–200). Leave blank to use the design default.
      </small>
    </label>
  );
}

export function Bilingual({
  base,
  label,
  en,
  ar,
  textarea = false,
  required = false,
  arRequired,
}: {
  base: string;
  label: string;
  en?: string;
  ar?: string;
  textarea?: boolean;
  required?: boolean;
  arRequired?: boolean;
}) {
  const C = textarea ? Textarea : Field;
  return (
    <div className="bilingual">
      <C name={`${base}En`} label={`${label}`} value={en} required={required} dir="ltr" />
      <C name={`${base}Ar`} label={`${label}`} value={ar} required={arRequired ?? required} dir="rtl" />
    </div>
  );
}
