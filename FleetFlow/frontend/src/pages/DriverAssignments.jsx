import { useEffect, useState } from "react";
import api from "../services/api";

function DriverAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);

  const [driverId, setDriverId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [tripId, setTripId] = useState("");
  const [remarks, setRemarks] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        assignmentsResponse,
        driversResponse,
        vehiclesResponse,
        tripsResponse,
      ] = await Promise.all([
        api.get("/driver-assignments/"),
        api.get("/drivers/"),
        api.get("/vehicles/"),
        api.get("/trips/"),
      ]);

      setAssignments(assignmentsResponse.data);
      setDrivers(driversResponse.data);
      setVehicles(vehiclesResponse.data);
      setTrips(tripsResponse.data);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
        "Unable to load driver assignments."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const availableDrivers = drivers.filter(
    (driver) =>
      driver.is_active &&
      driver.status === "Available"
  );

  const availableVehicles = vehicles.filter(
    (vehicle) => {
      if (
        !vehicle.is_active ||
        vehicle.current_status !== "Available"
      ) {
        return false;
      }

      /*
       * If the vehicle already has an associated driver,
       * make sure that driver is also available.
       */
      if (vehicle.driver_id) {
        const associatedDriver = drivers.find(
          (driver) =>
            driver.id === vehicle.driver_id
        );

        if (
          !associatedDriver ||
          !associatedDriver.is_active ||
          associatedDriver.status !== "Available"
        ) {
          return false;
        }
      }

      return true;
    }
  );

  const availableTrips = trips.filter(
    (trip) =>
      trip.trip_status === "Scheduled"
  );

  const getDriverName = (id) => {
    const driver = drivers.find(
      (item) => item.id === id
    );

    return driver
      ? driver.name
      : `Driver #${id}`;
  };

  const getVehicleName = (id) => {
    const vehicle = vehicles.find(
      (item) => item.id === id
    );

    return vehicle
      ? vehicle.registration_number
      : `Vehicle #${id}`;
  };

  const getTripName = (id) => {
    const trip = trips.find(
      (item) => item.id === id
    );

    if (!trip) {
      return `Trip #${id}`;
    }

    return `Trip #${trip.id} — ${trip.pickup_location} → ${trip.delivery_location}`;
  };

  const handleVehicleChange = (value) => {
    setVehicleId(value);

    const vehicle = vehicles.find(
      (item) => item.id === Number(value)
    );

    /*
     * If this vehicle already has an associated driver,
     * automatically select that driver.
     */
    if (vehicle?.driver_id) {
      const driver = drivers.find(
        (item) => item.id === vehicle.driver_id
      );

      if (
        driver &&
        driver.is_active &&
        driver.status === "Available"
      ) {
        setDriverId(String(driver.id));
      }
    }
  };

  const handleCreate = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!driverId || !vehicleId || !tripId) {
      setError(
        "Please select a driver, vehicle and trip."
      );
      return;
    }

    try {
      setSaving(true);

      await api.post("/driver-assignments/", {
        driver_id: Number(driverId),
        vehicle_id: Number(vehicleId),
        trip_id: Number(tripId),
        assignment_status: "Active",
        remarks: remarks || null,
      });

      setSuccess(
        "Driver assignment created successfully."
      );

      setDriverId("");
      setVehicleId("");
      setTripId("");
      setRemarks("");

      await fetchData();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
        "Unable to create driver assignment."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (assignmentId) => {
    const confirmed = window.confirm(
      "Remove this driver assignment?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await api.delete(
        `/driver-assignments/${assignmentId}`
      );

      setSuccess(
        "Driver assignment removed successfully."
      );

      await fetchData();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
        "Unable to remove assignment."
      );
    }
  };

  if (loading) {
    return (
      <div className="empty-state">
        Loading driver assignments...
      </div>
    );
  }

  return (
    <div>

      <div className="page-heading">

        <div>
          <h1>Driver Assignments</h1>

          <p>
            Assign available drivers and vehicles
            to scheduled trips.
          </p>
        </div>

        <button
          className="secondary-button"
          onClick={fetchData}
        >
          ↻ Refresh
        </button>

      </div>


      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {success && (
        <div className="success-message">
          {success}
        </div>
      )}


      <div className="assignment-layout">

        {/* Create Assignment */}

        <div className="form-card">

          <div className="form-card-header">

            <div>
              <h2>New Assignment</h2>

              <p>
                Only available resources can be assigned.
              </p>
            </div>

          </div>


          <form
            className="form-grid"
            onSubmit={handleCreate}
          >

            <div className="form-group">

              <label>
                Vehicle
              </label>

              <select
                value={vehicleId}
                onChange={(event) =>
                  handleVehicleChange(
                    event.target.value
                  )
                }
                required
              >
                <option value="">
                  Select vehicle
                </option>

                {availableVehicles.map(
                  (vehicle) => (
                    <option
                      key={vehicle.id}
                      value={vehicle.id}
                    >
                      {vehicle.registration_number}
                      {" — "}
                      {vehicle.vehicle_type}
                    </option>
                  )
                )}

              </select>

              {availableVehicles.length === 0 && (
                <small className="field-hint">
                  No available vehicles.
                </small>
              )}

            </div>


            <div className="form-group">

              <label>
                Driver
              </label>

              <select
                value={driverId}
                onChange={(event) =>
                  setDriverId(event.target.value)
                }
                required
              >
                <option value="">
                  Select driver
                </option>

                {availableDrivers.map(
                  (driver) => (
                    <option
                      key={driver.id}
                      value={driver.id}
                    >
                      {driver.name}
                    </option>
                  )
                )}

              </select>

              {availableDrivers.length === 0 && (
                <small className="field-hint">
                  No available drivers.
                </small>
              )}

            </div>


            <div className="form-group">

              <label>
                Trip
              </label>

              <select
                value={tripId}
                onChange={(event) =>
                  setTripId(event.target.value)
                }
                required
              >
                <option value="">
                  Select scheduled trip
                </option>

                {availableTrips.map(
                  (trip) => (
                    <option
                      key={trip.id}
                      value={trip.id}
                    >
                      {getTripName(trip.id)}
                    </option>
                  )
                )}

              </select>

              {availableTrips.length === 0 && (
                <small className="field-hint">
                  No scheduled trips available.
                </small>
              )}

            </div>


            <div className="form-group">

              <label>
                Remarks
              </label>

              <textarea
                value={remarks}
                onChange={(event) =>
                  setRemarks(event.target.value)
                }
                placeholder="Optional remarks"
                rows="3"
              />

            </div>


            <button
              type="submit"
              className="primary-button"
              disabled={saving}
            >
              {saving
                ? "Assigning..."
                : "Create Assignment"}
            </button>

          </form>

        </div>


        {/* Assignment List */}

        <div className="table-card">

          <div className="table-card-header">

            <div>
              <h2>Current Assignments</h2>

              <p>
                Driver and vehicle assignments.
              </p>
            </div>

          </div>


          {assignments.length === 0 ? (

            <div className="empty-table">
              No driver assignments found.
            </div>

          ) : (

            <div className="table-wrapper">

              <table>

                <thead>
                  <tr>
                    <th>Driver</th>
                    <th>Vehicle</th>
                    <th>Trip</th>
                    <th>Status</th>
                    <th>Assigned On</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>

                  {assignments.map(
                    (assignment) => (
                      <tr key={assignment.id}>

                        <td>
                          {getDriverName(
                            assignment.driver_id
                          )}
                        </td>

                        <td>
                          {getVehicleName(
                            assignment.vehicle_id
                          )}
                        </td>

                        <td>
                          {getTripName(
                            assignment.trip_id
                          )}
                        </td>

                        <td>
                          <span
                            className={`status-badge ${
                              assignment.assignment_status
                                .toLowerCase()
                                .replace(
                                  /\s+/g,
                                  "-"
                                )
                            }`}
                          >
                            {assignment.assignment_status}
                          </span>
                        </td>

                        <td>
                          {new Date(
                            assignment.assignment_date
                          ).toLocaleString(
                            "en-IN",
                            {
                              dateStyle: "medium",
                              timeStyle: "short",
                            }
                          )}
                        </td>

                        <td>
                          <button
                            className="danger-button"
                            onClick={() =>
                              handleDelete(
                                assignment.id
                              )
                            }
                          >
                            Remove
                          </button>
                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </div>

    </div>
  );
}

export default DriverAssignments;