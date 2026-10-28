"use client";

import { saveCareerJob } from "@/app/admin/actions";
import { ActionForm } from "./action-form";

export function CareerJobForm() {
  return (
    <div style={{ background: "#ffffff", padding: "24px", borderRadius: "10px", border: "1px solid var(--admin-border, #e5e5e5)" }}>
      <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "16px" }}>Post New Vacancy</h3>
      <ActionForm action={saveCareerJob} submitLabel="Create Vacancy">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Slug (unique, URL safe)</label>
            <input name="slug" placeholder="e.g. senior-architect" required style={{ width: "100%", height: "38px", padding: "0 10px", border: "1px solid #ccc", borderRadius: "6px" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Status & Sort Order</label>
            <div style={{ display: "flex", gap: "8px" }}>
              <select name="status" defaultValue="PUBLISHED" style={{ height: "38px", padding: "0 10px", border: "1px solid #ccc", borderRadius: "6px", flex: 1 }}>
                <option value="PUBLISHED">PUBLISHED</option>
                <option value="DRAFT">DRAFT</option>
              </select>
              <input name="sortOrder" type="number" defaultValue="0" style={{ width: "80px", height: "38px", padding: "0 10px", border: "1px solid #ccc", borderRadius: "6px" }} />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Title (English)</label>
            <input name="titleEn" placeholder="Senior Project Architect" required style={{ width: "100%", height: "38px", padding: "0 10px", border: "1px solid #ccc", borderRadius: "6px" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Title (Arabic)</label>
            <input name="titleAr" dir="rtl" placeholder="مهندس معماري أول" required style={{ width: "100%", height: "38px", padding: "0 10px", border: "1px solid #ccc", borderRadius: "6px" }} />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Department (English)</label>
            <input name="departmentEn" placeholder="Architecture & Design" required style={{ width: "100%", height: "38px", padding: "0 10px", border: "1px solid #ccc", borderRadius: "6px" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Department (Arabic)</label>
            <input name="departmentAr" dir="rtl" placeholder="التصميم المعماري" required style={{ width: "100%", height: "38px", padding: "0 10px", border: "1px solid #ccc", borderRadius: "6px" }} />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Location (English)</label>
            <input name="locationEn" defaultValue="Cairo, Egypt" style={{ width: "100%", height: "38px", padding: "0 10px", border: "1px solid #ccc", borderRadius: "6px" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Location (Arabic)</label>
            <input name="locationAr" dir="rtl" defaultValue="القاهرة، مصر" style={{ width: "100%", height: "38px", padding: "0 10px", border: "1px solid #ccc", borderRadius: "6px" }} />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Description (English)</label>
            <textarea name="descriptionEn" rows={3} placeholder="Role overview, responsibilities..." required style={{ width: "100%", padding: "8px 10px", border: "1px solid #ccc", borderRadius: "6px" }} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Description (Arabic)</label>
            <textarea name="descriptionAr" dir="rtl" rows={3} placeholder="نظرة عامة على الدور والمسؤوليات..." required style={{ width: "100%", padding: "8px 10px", border: "1px solid #ccc", borderRadius: "6px" }} />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Requirements (English)</label>
            <textarea name="requirementsEn" rows={3} placeholder="Required qualifications, experience..." style={{ width: "100%", padding: "8px 10px", border: "1px solid #ccc", borderRadius: "6px" }} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Requirements (Arabic)</label>
            <textarea name="requirementsAr" dir="rtl" rows={3} placeholder="المؤهلات المطلوبة، سنوات الخبرة..." style={{ width: "100%", padding: "8px 10px", border: "1px solid #ccc", borderRadius: "6px" }} />
          </div>
        </div>
      </ActionForm>
    </div>
  );
}
