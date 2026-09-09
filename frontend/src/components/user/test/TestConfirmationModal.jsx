import { createPortal } from "react-dom";
import { useEffect } from "react";

export function TestConfirmationModal({ open, onConfirm, onCancel }) {
  useEffect(() => {
    if (!open || typeof document === "undefined") return undefined;

    document.body.classList.add("challenge-modal-open");
    return () => document.body.classList.remove("challenge-modal-open");
  }, [open]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="test-confirm-backdrop" role="dialog" aria-modal="true" aria-labelledby="test-confirm-title">
      <div className="test-confirm-modal">
        <h2 id="test-confirm-title">Are you ready to start the test?</h2>
        <p>
          Make sure you are ready before opening the assessment workspace. Your session will load in full view.
        </p>
        <div className="test-confirm-actions">
          <button type="button" className="test-confirm-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="test-confirm-start" onClick={onConfirm}>
            Start Now
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
