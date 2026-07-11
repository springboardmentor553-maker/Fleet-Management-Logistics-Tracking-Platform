import "./Vehicle.css";
import { FaEdit, FaTrash } from "react-icons/fa";

function VehicleTable({ vehicles, onEdit, onDelete }) {
  return (
    <div className="table-card">
      <div className="table-header">
        <h2>Vehicle List</h2>
      </div>

      <div className="table-responsive">
        <table className="vehicle-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Vehicle Number</th>
              <th>Registration No.</th>
              <th>Type</th>
              <th>Capacity</th>
              <th>Fuel</th>
              <th>Status</th>
              <th>Driver ID</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {vehicles.length === 0 ? (
              <tr>
                <td colSpan="9" className="no-data">
                  No Vehicles Found
                </td>
              </tr>
            ) : (
              vehicles.map((vehicle) => (
                <tr key={vehicle.id}>
                  <td>{vehicle.id}</td>

                  <td>{vehicle.vehicle_number}</td>

                  <td>{vehicle.registration_number}</td>

                  <td>{vehicle.vehicle_type}</td>

                  <td>{vehicle.capacity}</td>

                  <td>{vehicle.fuel_type}</td>

                  <td>
                    <span
                      className={
                        vehicle.status === "Available"
                          ? "status available"
                          : vehicle.status === "Busy"
                          ? "status busy"
                          : "status maintenance"
                      }
                    >
                      {vehicle.status}
                    </span>
                  </td>

                  <td>{vehicle.driver_id}</td>

                  <td className="action-cell">
                    <div className="action-buttons">
                      <button
                        className="edit-btn"
                        onClick={() => onEdit(vehicle)}
                      >
                        <FaEdit />
                      </button>

                      <button
                        className="delete-btn"
                        onClick={() => onDelete(vehicle.id)}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default VehicleTable;