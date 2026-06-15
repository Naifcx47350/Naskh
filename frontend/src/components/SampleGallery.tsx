import { motion } from "framer-motion";
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
    return <p className="text-sm" style={{ color: "var(--warn)" }}>{error}</p>;
  }

  if (!samples.length) {
    return <div className="naskh-skeleton-block h-36" aria-busy="true" />;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {samples.map((sample, index) => (
        <motion.button
          key={sample.id}
          type="button"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.04 }}
          className={`naskh-sample-card ${loadingId === sample.id ? "naskh-sample-card-loading" : ""}`}
          onClick={() => onSelect(sample.id)}
          disabled={Boolean(loadingId)}
          aria-label={`Load sample ${sample.name}`}
        >
          <div className="naskh-sample-thumb-wrap">
            <img src={`${API_BASE}${sample.thumbnail_url}`} alt="" className="naskh-sample-thumb" />
            {sample.recommended_lead && (
              <span className="naskh-sample-badge">
                <Star size={10} /> Lead demo
              </span>
            )}
          </div>
          <p className="mt-3 font-semibold">{sample.name}</p>
          <p className="mt-1 text-xs leading-5" style={{ color: "var(--text-muted)" }}>
            {sample.description}
          </p>
        </motion.button>
      ))}
    </div>
  );
}
