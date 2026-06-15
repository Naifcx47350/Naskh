import { AlertTriangle, Filter } from "lucide-react";

import { reviewCount } from "../lib/documentIntel";

export function ReviewBanner({
  fieldCount,
  reviewFields,
  showReviewOnly,
  onToggleReviewOnly,
  onJumpToReview,
}: {
  fieldCount: number;
  reviewFields: number;
  showReviewOnly: boolean;
  onToggleReviewOnly: () => void;
  onJumpToReview: () => void;
}) {
  if (!fieldCount) return null;

  return (
    <div className={`naskh-review-banner ${reviewFields ? "naskh-review-banner-warn" : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-2">
          {reviewFields > 0 ? <AlertTriangle size={18} /> : null}
          <div>
            <p className="font-semibold">
              {reviewFields > 0 ? `${reviewFields} field${reviewFields === 1 ? "" : "s"} need review` : "All fields above review threshold"}
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              AI first pass — verify low-confidence items before export.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {reviewFields > 0 && (
            <button type="button" className="naskh-btn-secondary px-3 py-2 text-xs" onClick={onJumpToReview}>
              Jump to first review
            </button>
          )}
          <button
            type="button"
            className={`naskh-btn-secondary px-3 py-2 text-xs ${showReviewOnly ? "naskh-btn-secondary-active" : ""}`}
            onClick={onToggleReviewOnly}
          >
            <Filter size={14} /> {showReviewOnly ? "Show all fields" : "Review only"}
          </button>
        </div>
      </div>
    </div>
  );
}
