import React from "react";

export function SkeletonRows({ rows = 5, cols = 5 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr className="skeleton-row" key={r}>
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c}>
              <div className="skeleton-box" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function SkeletonCards({ count = 4 }) {
  return (
    <div className="metrics-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div className="metric-card skeleton-card" key={i}>
          <div className="skeleton-box short" />
          <div className="skeleton-box tall" />
        </div>
      ))}
    </div>
  );
}
