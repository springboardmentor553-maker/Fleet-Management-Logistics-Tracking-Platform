import React from "react";

export function EmptyState({ title, description, actionText, onAction }) {
  return (
    <div className="empty-state-card">
      <div className="empty-icon">📦</div>
      <h3>{title || "No Records Found"}</h3>
      <p>{description || "There are no entries in the database yet."}</p>
      {actionText && onAction && (
        <button className="btn primary" onClick={onAction} type="button">
          + {actionText}
        </button>
      )}
    </div>
  );
}
