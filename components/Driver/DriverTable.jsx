import "./Driver.css";

import { FaEdit, FaTrash } from "react-icons/fa";

function DriverTable({
  drivers,

  onEdit,

  onDelete,
}) {
  return (
    <div className="table-card">
      <div className="table-header">
        <h2>Driver List</h2>
      </div>

      <div className="table-responsive">
        <table className="driver-table">
          <thead>
            <tr>
              <th>ID</th>

              <th>Name</th>

              <th>License Number</th>

              <th>Phone</th>

              <th>Status</th>

              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {drivers.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-data">
                  No Drivers Available
                </td>
              </tr>
            ) : (
              drivers.map((driver, index) => (
                <tr key={driver.id}>
                  <td>{index + 1}</td>

                  <td>{driver.name}</td>

                  <td>{driver.license_number}</td>

                  <td>{driver.phone}</td>

                  <td>
                    <span
                      className={
                        driver.status === "Available"
                          ? "status available"
                          : driver.status === "Busy"
                            ? "status busy"
                            : "status leave"
                      }
                    >
                      {driver.status}
                    </span>
                  </td>

                  <td>
                    <div className="action-buttons">
                      <button
                        className="edit-btn"
                        onClick={() => onEdit(driver)}
                      >
                        <FaEdit />
                       
                      </button>

                      <button
                        className="delete-btn"
                        onClick={() => onDelete(driver.id)}
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

export default DriverTable;
