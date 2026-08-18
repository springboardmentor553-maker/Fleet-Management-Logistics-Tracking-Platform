import React, { useEffect } from "react";

export function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const isError = toast.type === "error";

  return (
    <div className={`toast-container ${toast.type || "info"}`}>
      <div className="toast-content">
        <span className="toast-icon">{isError ? "⚠️" : "✓"}</span>
        <div className="toast-text">
          <p className="toast-title">{isError ? "Error" : "Success"}</p>
          <p className="toast-message">{toast.message}</p>
        </div>
        <button className="toast-close" onClick={onClose} type="button">
          ×
        </button>
      </div>
    </div>
  );
}
