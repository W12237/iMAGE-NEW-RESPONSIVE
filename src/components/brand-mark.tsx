export function BrandMark({ light = false }: { light?: boolean }) {
  return (
    <span className={`brand-mark ${light ? "brand-mark--light" : ""}`} aria-label="Image Developments">
      <svg className="brand-symbol" viewBox="0 0 58 86" aria-hidden="true">
        <path className="brand-symbol-arch" d="M10 29C10 13 18.5 2 29 2s19 11 19 27v22H10V29Z" />
        <circle className="brand-symbol-sun" cx="29" cy="23" r="11" />
        <path className="brand-symbol-left" d="m29 34 0 50L2 58l27-24Z" />
        <path className="brand-symbol-right" d="m29 34 27 24-27 26V34Z" />
      </svg>
      <span className="brand-word"><b>IMAGE</b><small>DEVELOPMENTS</small></span>
    </span>
  );
}
