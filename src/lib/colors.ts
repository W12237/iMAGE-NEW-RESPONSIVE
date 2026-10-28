export function normalizeRgb(input: unknown, fallback = "255, 255, 255") {
  const value = String(input ?? "").trim();
  if (!value) return fallback;

  const hex = value.match(/^#([\da-f]{3}|[\da-f]{6})$/i)?.[1];
  if (hex) {
    const expanded = hex.length === 3 ? [...hex].map(char => char + char).join("") : hex;
    return [0, 2, 4].map(index => Number.parseInt(expanded.slice(index, index + 2), 16)).join(", ");
  }

  const rgb = value.match(/^rgb\(\s*([^)]*)\s*\)$/i)?.[1] ?? value;
  const channels = rgb.split(",").map(channel => Number(channel.trim()));
  if (channels.length !== 3 || channels.some(channel => !Number.isInteger(channel) || channel < 0 || channel > 255)) return fallback;
  return channels.join(", ");
}

export function rgbToHex(input: unknown) {
  const channels = normalizeRgb(input).split(",").map(channel => Number(channel.trim()));
  return `#${channels.map(channel => channel.toString(16).padStart(2, "0")).join("")}`;
}

export function hexToRgb(hex: string) {
  return normalizeRgb(hex);
}
