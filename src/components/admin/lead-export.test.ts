import { describe, expect, it } from "vitest";
import { leadsToCsv, type ExportLead } from "./lead-export";

const lead: ExportLead = {
  createdAt: "2026-10-19T12:00:00.000Z",
  name: "Jane, Doe",
  email: "jane@example.com",
  phone: "+20 100 000 0000",
  subject: "North Coast",
  message: "Interested in a \"villa\"",
  status: "NEW",
  notes: "Call tomorrow",
};

describe("leadsToCsv", () => {
  it("escapes commas and quotes", () => {
    const csv = leadsToCsv([lead]);
    expect(csv).toContain('"Jane, Doe"');
    expect(csv).toContain('"Interested in a ""villa"""');
  });

  it("prevents spreadsheet formulas from executing", () => {
    const csv = leadsToCsv([{ ...lead, name: "=1+1" }]);
    expect(csv).toContain('"\'=1+1"');
  });
});
