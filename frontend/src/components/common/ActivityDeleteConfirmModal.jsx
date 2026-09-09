import { X } from "lucide-react";
import "../../styles/shared/activityDelete.css";

export default function ActivityDeleteConfirmModal({ activityLabel, onCancel, onConfirm }) {
  const isBulkDelete = String(activityLabel || "").toLowerCase().startsWith("all ");

  return (
    <div className="activity-delete-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="activity-delete-title">
      <div className="activity-delete-modal">
        <button type="button" className="activity-delete-modal-close" aria-label="Cancel delete activity" onClick={onCancel}>
          <X size={16} aria-hidden />
        </button>
        <h3 id="activity-delete-title">{isBulkDelete ? "Delete activities?" : "Delete activity?"}</h3>
        <p>
          This removes <strong>{activityLabel || "this activity"}</strong> from your activity view only.
        </p>
        <div className="activity-delete-modal-actions">
          <button type="button" className="activity-delete-modal-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="activity-delete-modal-danger" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
