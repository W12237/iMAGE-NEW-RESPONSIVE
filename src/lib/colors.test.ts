import { describe, expect, it } from "vitest";
import { hexToRgb, normalizeRgb, rgbToHex } from "./colors";

describe("section colors", () => {
  it.each([
    ["12,34, 56", "12, 34, 56"],
    ["rgb(12, 34, 56)", "12, 34, 56"],
    ["#0c2238", "12, 34, 56"],
    ["#abc", "170, 187, 204"],
    ["", "255, 255, 255"],
    ["not-a-color", "255, 255, 255"],
  ])("normalizes %s", (input, expected) => expect(normalizeRgb(input)).toBe(expected));

  it("converts between the picker and stored formats", () => {
    expect(rgbToHex("12, 34, 56")).toBe("#0c2238");
    expect(hexToRgb("#0c2238")).toBe("12, 34, 56");
  });
});
