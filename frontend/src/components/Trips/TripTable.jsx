import "./Trip.css";

import { FaEdit, FaTrash } from "react-icons/fa";

function TripTable({
  trips,

  onEdit,

  onDelete,
}) {
  return (
    <div className="table-card">
      <div className="table-header">
        <h2>Trip List</h2>
      </div>

      <div className="table-responsive">
        <table className="trip-table">
          <thead>
            <tr>
              <th>#</th>

              <th>Shipment</th>

              <th>Driver</th>

              <th>Vehicle</th>

              <th>Pickup</th>

              <th>Destination</th>

              <th>Start Time</th>

              <th>End Time</th>

              <th>Status</th>

              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {trips.length === 0 ? (
              <tr>
                <td colSpan="10" className="no-data">
                  No Trips Available
                </td>
              </tr>
            ) : (
              trips.map((trip, index) => (
                <tr key={trip.id}>
                  <td>{index + 1}</td>

                  <td>{trip.shipment_id}</td>

                  <td>{trip.driver_id}</td>

                  <td>{trip.vehicle_id}</td>

                  <td>{trip.pickup_location}</td>

                  <td>{trip.destination}</td>
                  <td>
                    {new Date(trip.scheduled_start_time).toLocaleString()}
                  </td>

                  <td>{new Date(trip.scheduled_end_time).toLocaleString()}</td>

                  <td>
                    <span
                      className={
                        trip.trip_status === "Scheduled"
                          ? "status scheduled"
                          : trip.trip_status === "In Progress"
                            ? "status progress"
                            : trip.trip_status === "Completed"
                              ? "status completed"
                              : "status cancelled"
                      }
                    >
                      {trip.trip_status}
                    </span>
                  </td>

                  <td>
                    <div className="action-buttons">
                      <button className="edit-btn" onClick={() => onEdit(trip)}>
                        <FaEdit />
                      </button>

                      <button
                        className="delete-btn"
                        onClick={() => onDelete(trip.id)}
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

export default TripTable;
