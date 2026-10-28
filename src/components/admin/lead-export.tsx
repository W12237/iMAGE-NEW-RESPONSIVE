"use client";

import { useState } from "react";

export type ExportLead = {
  createdAt: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: string;
  notes: string;
};

type ExportFormat = "csv" | "json" | "pdf";

const csvCell = (value: string) => {
  const safeValue = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safeValue.replaceAll('"', '""')}"`;
};

export function leadsToCsv(leads: ExportLead[]) {
  const headings = ["Date", "Name", "Email", "Phone", "Project", "Message", "Status", "Follow-up notes"];
  const rows = leads.map((lead) => [
    lead.createdAt,
    lead.name,
    lead.email,
    lead.phone,
    lead.subject,
    lead.message,
    lead.status,
    lead.notes,
  ]);

  return [headings, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
}

function downloadFile(contents: string, type: string, filename: string) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function LeadExport({ leads }: { leads: ExportLead[] }) {
  const [format, setFormat] = useState<ExportFormat>("csv");

  function exportLeads() {
    const date = new Date().toISOString().slice(0, 10);

    if (format === "pdf") {
      window.print();
      return;
    }

    if (format === "json") {
      downloadFile(JSON.stringify(leads, null, 2), "application/json;charset=utf-8", `leads-${date}.json`);
      return;
    }

    downloadFile(`\uFEFF${leadsToCsv(leads)}`, "text/csv;charset=utf-8", `leads-${date}.csv`);
  }

  return (
    <div className="lead-export" aria-label="Export leads">
      <label>
        <span>Export format</span>
        <select value={format} onChange={(event) => setFormat(event.target.value as ExportFormat)}>
          <option value="csv">Excel (CSV)</option>
          <option value="pdf">PDF</option>
          <option value="json">JSON</option>
        </select>
      </label>
      <button className="primary" type="button" onClick={exportLeads} disabled={!leads.length}>
        Export {leads.length} {leads.length === 1 ? "lead" : "leads"}
      </button>
    </div>
  );
}
