import { Star } from "lucide-react";
import { useEffect, useState } from "react";

import { API_BASE, api } from "../lib/api";
import type { SampleInfo } from "../types";

export function SampleGallery({
  onSelect,
  loadingId,
}: {
  onSelect: (sampleId: string) => void;
  loadingId: string | null;
}) {
  const [samples, setSamples] = useState<SampleInfo[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<SampleInfo[]>("/api/samples")
      .then(setSamples)
      .catch(() => setError("Could not load sample gallery."));
  }, []);

  if (error) {
    return <p className="mt-4 text-sm" style={{ color: "var(--warn)" }}>{error}</p>;
  }

  if (!samples.length) {
    return <div className="naskh-skeleton-block mt-4 h-16" aria-busy="true" />;
  }

  return (
    <div className="naskh-sample-strip mt-5">
      <p className="naskh-sample-strip-label">Sample documents — hover to preview, click to load</p>
      <div className="naskh-sample-strip-row">
        {samples.map((sample) => (
          <button
            key={sample.id}
            type="button"
            className={`naskh-sample-strip-card ${loadingId === sample.id ? "naskh-sample-strip-card-loading" : ""}`}
            onClick={() => onSelect(sample.id)}
            disabled={Boolean(loadingId)}
            aria-label={`Load sample ${sample.name}`}
          >
            <div className="naskh-sample-strip-thumb-wrap">
              <img src={`${API_BASE}${sample.thumbnail_url}`} alt="" className="naskh-sample-strip-thumb" />
              {sample.recommended_lead && (
                <span className="naskh-sample-strip-badge">
                  <Star size={9} />
                </span>
              )}
            </div>
            <div className="naskh-sample-strip-meta">
              <p className="naskh-sample-strip-name">{sample.name}</p>
              <p className="naskh-sample-strip-desc">{sample.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
