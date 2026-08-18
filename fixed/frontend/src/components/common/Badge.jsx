import React from "react";

export function Badge({ status }) {
  if (!status && status !== 0) return null;
  const s = String(status).toLowerCase();

  let variant = "neutral";
  if (
    ["available", "delivered", "completed", "present", "active", "created"].includes(
      s
    )
  ) {
    variant = "success";
  } else if (
    [
      "in transit",
      "assigned",
      "picked up",
      "out for delivery",
      "in progress",
      "scheduled",
    ].includes(s)
  ) {
    variant = "warning";
  } else if (
    [
      "under maintenance",
      "delayed",
      "cancelled",
      "absent",
      "critical",
      "danger",
      "error",
    ].includes(s)
  ) {
    variant = "danger";
  } else if (["leave", "info", "pending"].includes(s)) {
    variant = "info";
  }

  return <span className={`badge badge-${variant}`}>{status}</span>;
}
