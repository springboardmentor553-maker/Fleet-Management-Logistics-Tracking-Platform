export default function VehicleTable({
  vehicles,
  onEdit,
  onDelete,
}) {
  return (
    <table border="1" cellPadding="8" style={{ width: "100%", marginTop: "20px" }}>
      <thead>
        <tr>
          <th>ID</th>
          <th>Vehicle Number</th>
          <th>Type</th>
          <th>Model</th>
          <th>Capacity</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>

      <tbody>
        {vehicles.length === 0 ? (
          <tr>
            <td colSpan="7">No vehicles found.</td>
          </tr>
        ) : (
          vehicles.map((vehicle) => (
            <tr key={vehicle.id}>
              <td>{vehicle.id}</td>
              <td>{vehicle.vehicle_number}</td>
              <td>{vehicle.vehicle_type}</td>
              <td>{vehicle.model}</td>
              <td>{vehicle.capacity}</td>
              <td>{vehicle.status}</td>

              <td>
                <button onClick={() => onEdit(vehicle)}>
                  Edit
                </button>

                <button
                  onClick={() => onDelete(vehicle.id)}
                  style={{ marginLeft: "10px" }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}