const STATUS_STYLES = {
  active: "bg-status-available/15 text-status-available",
  available: "bg-status-available/15 text-status-available",
  delivered: "bg-status-available/15 text-status-available",
  in_transit: "bg-status-transit/15 text-status-transit",
  on_trip: "bg-status-transit/15 text-status-transit",
  assigned: "bg-signal/15 text-signal",
  pending: "bg-signal/15 text-signal",
  in_shop: "bg-signal/15 text-signal",
  off_duty: "bg-status-idle/15 text-status-idle",
  retired: "bg-status-idle/15 text-status-idle",
  cancelled: "bg-status-alert/15 text-status-alert",
};

export function StatusBadge({ status }) {
  const key = String(status || "").toLowerCase();
  const style = STATUS_STYLES[key] || "bg-status-idle/15 text-status-idle";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-data font-medium uppercase tracking-wide ${style}`}
    >
      {key.replaceAll("_", " ")}
    </span>
  );
}
