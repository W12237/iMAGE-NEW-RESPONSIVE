"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Project, ProjectVisualTour } from "@prisma/client";
import { deleteProject } from "@/app/admin/actions";
import { DeleteActionButton } from "./delete-action-button";

type ProjectWithMeta = Project & {
  visualTours?: ProjectVisualTour[];
};

interface ProjectListManagerProps {
  items: ProjectWithMeta[];
}

export function ProjectListManager({ items }: ProjectListManagerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [deliveryFilter, setDeliveryFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [locationFilter, setLocationFilter] = useState<string>("ALL");

  // Extract unique locations for filtering
  const uniqueLocations = useMemo(() => {
    const locs = new Set<string>();
    items.forEach((p) => {
      if (p.locationEn) locs.add(p.locationEn.trim());
    });
    return Array.from(locs).sort();
  }, [items]);

  // Filtered projects
  const filtered = useMemo(() => {
    return items.filter((p) => {
      // 1. Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.nameEn.toLowerCase().includes(q) || p.nameAr.toLowerCase().includes(q);
        const matchLoc = p.locationEn.toLowerCase().includes(q) || p.locationAr.toLowerCase().includes(q);
        const matchSlug = p.slug.toLowerCase().includes(q);
        if (!matchName && !matchLoc && !matchSlug) return false;
      }

      // 2. Publication status filter
      if (statusFilter !== "ALL" && p.status !== statusFilter) return false;

      // 3. Delivery state filter
      if (deliveryFilter !== "ALL" && p.progressStatus !== deliveryFilter) return false;

      // 4. Project type filter
      if (typeFilter !== "ALL" && p.projectType !== typeFilter) return false;

      // 5. Location filter
      if (locationFilter !== "ALL" && p.locationEn !== locationFilter) return false;

      return true;
    });
  }, [items, searchQuery, statusFilter, deliveryFilter, typeFilter, locationFilter]);

  return (
    <div className="project-list-manager">
      {/* Search and Filters Bar */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(200px, 1.5fr) repeat(auto-fit, minmax(140px, 1fr))",
          gap: "12px",
          alignItems: "center",
          padding: "16px",
          background: "#ffffff",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--line)",
          marginBottom: "16px",
        }}
      >
        <div>
          <label htmlFor="project-search" style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: "4px" }}>
            Search Projects
          </label>
          <input
            id="project-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, location, or slug..."
            style={{ width: "100%", padding: "6px 10px", fontSize: "13px", borderRadius: "4px", border: "1px solid var(--line)" }}
          />
        </div>

        <div>
          <label htmlFor="status-filter" style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: "4px" }}>
            Publication State
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: "100%", padding: "6px 10px", fontSize: "13px", borderRadius: "4px", border: "1px solid var(--line)" }}
          >
            <option value="ALL">All States</option>
            <option value="PUBLISHED">Published Only</option>
            <option value="DRAFT">Draft Only</option>
            <option value="ARCHIVED">Archived Only</option>
          </select>
        </div>

        <div>
          <label htmlFor="delivery-filter" style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: "4px" }}>
            Delivery Status
          </label>
          <select
            id="delivery-filter"
            value={deliveryFilter}
            onChange={(e) => setDeliveryFilter(e.target.value)}
            style={{ width: "100%", padding: "6px 10px", fontSize: "13px", borderRadius: "4px", border: "1px solid var(--line)" }}
          >
            <option value="ALL">All Delivery States</option>
            <option value="Ongoing">Ongoing / قيد الإنشاء</option>
            <option value="Delivered">Delivered / تم التسليم</option>
            <option value="Upcoming">Upcoming / قريباً</option>
          </select>
        </div>

        <div>
          <label htmlFor="type-filter" style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: "4px" }}>
            Project Type
          </label>
          <select
            id="type-filter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ width: "100%", padding: "6px 10px", fontSize: "13px", borderRadius: "4px", border: "1px solid var(--line)" }}
          >
            <option value="ALL">All Types</option>
            <option value="Residential">Residential / سكني</option>
            <option value="Commercial">Commercial / تجاري</option>
            <option value="Medical">Medical / طبي</option>
          </select>
        </div>

        <div>
          <label htmlFor="location-filter" style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: "4px" }}>
            Location
          </label>
          <select
            id="location-filter"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            style={{ width: "100%", padding: "6px 10px", fontSize: "13px", borderRadius: "4px", border: "1px solid var(--line)" }}
          >
            <option value="ALL">All Locations</option>
            {uniqueLocations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", fontSize: "13px", color: "var(--muted)" }}>
        <span>
          Showing <strong>{filtered.length}</strong> of {items.length} development{items.length === 1 ? "" : "s"}
        </span>
        {(searchQuery || statusFilter !== "ALL" || deliveryFilter !== "ALL" || typeFilter !== "ALL" || locationFilter !== "ALL") && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("ALL");
              setDeliveryFilter("ALL");
              setTypeFilter("ALL");
              setLocationFilter("ALL");
            }}
            className="secondary"
            style={{ fontSize: "11px", padding: "4px 8px" }}
          >
            Reset Filters ✕
          </button>
        )}
      </div>

      {/* Projects Table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Preview</th>
              <th>Project &amp; Location</th>
              <th>Status</th>
              <th>Type &amp; Delivery</th>
              <th>Visual Tour</th>
              <th>Last Updated</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((x) => {
              const hasTours = Boolean(x.visualTours && x.visualTours.length > 0);
              return (
                <tr key={x.id}>
                  <td style={{ width: "68px" }}>
                    <div
                      style={{
                        width: "56px",
                        height: "40px",
                        position: "relative",
                        borderRadius: "6px",
                        overflow: "hidden",
                        background: "#e4ebe5",
                      }}
                    >
                      {x.coverImageUrl ? (
                        <Image src={x.coverImageUrl} alt={x.nameEn} fill style={{ objectFit: "cover" }} sizes="56px" />
                      ) : null}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                      <strong style={{ fontSize: "14px", color: "var(--ink)" }}>{x.nameEn}</strong>
                      <span style={{ fontSize: "13px", color: "var(--muted)" }}>({x.nameAr})</span>
                    </div>
                    <small style={{ color: "var(--muted)", display: "block", marginTop: "2px" }}>
                      {x.locationEn} • {x.locationAr}
                    </small>
                  </td>
                  <td>
                    <span className={`status-badge status-${x.status.toLowerCase()}`}>{x.status}</span>
                  </td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink)" }}>{x.projectType}</span>
                      <span style={{ fontSize: "11px", color: "var(--muted)" }}>{x.progressStatus}</span>
                    </div>
                  </td>
                  <td>
                    {hasTours ? (
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "#166534",
                          background: "#dcfce7",
                          padding: "2px 8px",
                          borderRadius: "10px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        ✓ {x.visualTours!.length} Tour{x.visualTours!.length === 1 ? "" : "s"}
                      </span>
                    ) : (
                      <span style={{ fontSize: "12px", color: "var(--muted)" }}>—</span>
                    )}
                  </td>
                  <td>
                    <span style={{ fontSize: "13px", color: "var(--muted)" }}>
                      {x.updatedAt.toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions" style={{ justifyContent: "flex-end", gap: "6px" }}>
                      <Link
                        href={`/admin/projects/${x.id}`}
                        className="secondary"
                        style={{ padding: "6px 10px", fontSize: "12px" }}
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/en/projects/${x.slug}${x.status !== "PUBLISHED" ? "?preview=true" : ""}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="secondary"
                        style={{ padding: "6px 8px", fontSize: "11px" }}
                        title="Preview English Page"
                      >
                        EN ↗
                      </Link>
                      <Link
                        href={`/ar/projects/${x.slug}${x.status !== "PUBLISHED" ? "?preview=true" : ""}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="secondary"
                        style={{ padding: "6px 8px", fontSize: "11px" }}
                        title="Preview Arabic Page"
                      >
                        عربي ↗
                      </Link>
                      <DeleteActionButton id={x.id} name={x.nameEn} action={deleteProject} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {!filtered.length && (
          <div className="empty" style={{ padding: "40px 24px" }}>
            <p style={{ margin: "0 0 12px", fontSize: "15px", color: "var(--muted)" }}>
              {items.length === 0 ? "No projects created yet." : "No projects match the selected filters."}
            </p>
            {items.length === 0 && (
              <Link className="primary" href="/admin/projects/new">
                Create your first project
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
