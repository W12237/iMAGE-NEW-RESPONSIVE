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
  mobileValue,
}: {
  sectionKey: string;
  label: string;
  value?: number;
  mobileValue?: number;
}) {
  return (
    <div style={{ background: "#ffffff", border: "1px solid #e7ded4", borderRadius: "10px", padding: "14px 16px", marginBottom: "12px" }}>
      <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--forest, #152a20)", marginBottom: "8px" }}>
        {label}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px", fontWeight: 500, color: "#68736d" }}>
          <span>Desktop Font Size (px)</span>
          <input
            name={`fontSizeDesktop_${sectionKey}`}
            defaultValue={value ?? ""}
            type="number"
            min="12"
            max="200"
            step="1"
            placeholder="Design default"
            style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc", fontFamily: "inherit" }}
          />
          <input type="hidden" name={`fontSize_${sectionKey}`} value={value ?? ""} />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px", fontWeight: 500, color: "#68736d" }}>
          <span>Mobile Font Size (px)</span>
          <input
            name={`fontSizeMobile_${sectionKey}`}
            defaultValue={mobileValue ?? ""}
            type="number"
            min="12"
            max="100"
            step="1"
            placeholder="Design default"
            style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc", fontFamily: "inherit" }}
          />
        </label>
      </div>
      <small style={{ color: "#8a948e", fontSize: "11px", marginTop: "6px", display: "block" }}>
        Leave either field blank to use the responsive fluid design default.
      </small>
    </div>
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
