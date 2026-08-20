function StatusBadge({ status }) {
  const colors = {
    Created: "gray",
    Assigned: "blue",
    "Picked Up": "orange",
    "In Transit": "purple",
    "Out for Delivery": "teal",
    Delivered: "green",
    Delayed: "red",
    Cancelled: "black",
  };

  return (
    <span
      style={{
        background: colors[status],
        color: "white",
        padding: "5px 10px",
        borderRadius: "5px",
      }}
    >
      {status}
    </span>
  );
}

export default StatusBadge;