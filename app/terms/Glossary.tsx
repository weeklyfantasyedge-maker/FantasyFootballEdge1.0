"use client";

import { useMemo, useState } from "react";
import { CATEGORIES, STATUS_LABEL, TERMS } from "./terms-data";
import type { Category, Status } from "./terms-data";

function slug(term: string): string {
  return term
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function Glossary() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"All" | Category>("All");

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TERMS.filter((t) => (category === "All" ? true : t.category === category)).filter(
      (t) =>
        q === "" ||
        t.term.toLowerCase().includes(q) ||
        t.what.toLowerCase().includes(q) ||
        t.why.toLowerCase().includes(q)
    );
  }, [query, category]);

  const statuses: Status[] = ["live", "soon", "licensed", "ref"];

  return (
    <div>
      <div className="terms-tools">
        <label className="search">
          <span>Search terms</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Try target share, EPA, or wind"
          />
        </label>
        <div className="tabs" role="group" aria-label="Filter by category">
          {(["All", ...CATEGORIES] as const).map((c) => (
            <button
              key={c}
              type="button"
              className="tab"
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="legend" aria-label="What the tags mean">
        {statuses.map((s) => (
          <span key={s} className={`pill ${s}`}>
            {STATUS_LABEL[s]}
          </span>
        ))}
        <span className="legend-note">
          Tags show what the Edge Board actually uses today, so a term is never listed as
          part of the score when it is not.
        </span>
      </div>

      {shown.length === 0 ? (
        <p className="empty">No terms match that search. Clear the search or pick All.</p>
      ) : (
        <ul className="term-list">
          {shown.map((t) => (
            <li key={t.term} id={slug(t.term)} className="term">
              <div>
                <h3>{t.term}</h3>
                <div className="term-cat">{t.category}</div>
                <span className={`pill ${t.status}`}>{STATUS_LABEL[t.status]}</span>
              </div>
              <div>
                <p>{t.what}</p>
                <p className="why">
                  <strong>Why it matters:</strong> {t.why}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
