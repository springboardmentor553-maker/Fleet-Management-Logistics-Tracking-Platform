import { useEffect, useState } from "react";
import api from "../services/api";

const emptyForm = {
  driver_id: "",
  date: "",
  attendance_status: "Present",
  check_in_time: "",
  check_out_time: "",
};

function DriverAttendance() {
  const [records, setRecords] = useState([]);
  const [drivers, setDrivers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        attendanceResponse,
        driversResponse,
      ] = await Promise.all([
        api.get("/driver-attendance/"),
        api.get("/drivers/"),
      ]);

      setRecords(attendanceResponse.data);
      setDrivers(driversResponse.data);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
        "Unable to load attendance records."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const activeDrivers = drivers.filter(
    (driver) => driver.is_active
  );

  const getDriverName = (driverId) => {
    const driver = drivers.find(
      (item) => item.id === driverId
    );

    return driver
      ? driver.name
      : `Driver #${driverId}`;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const openAddForm = () => {
    setEditingRecord(null);

    setForm({
      ...emptyForm,
      date: new Date().toISOString().split("T")[0],
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const openEditForm = (record) => {
    setEditingRecord(record);

    setForm({
      driver_id: String(record.driver_id),
      date: record.date || "",
      attendance_status:
        record.attendance_status || "Present",
      check_in_time:
        record.check_in_time || "",
      check_out_time:
        record.check_out_time || "",
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) {
      return;
    }

    setShowForm(false);
    setEditingRecord(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (!editingRecord) {
        await api.post(
          "/driver-attendance/",
          {
            driver_id: Number(form.driver_id),
            date: form.date,
            attendance_status:
              form.attendance_status,
            check_in_time:
              form.check_in_time || null,
            check_out_time:
              form.check_out_time || null,
          }
        );
      } else {
        await api.put(
          `/driver-attendance/${editingRecord.id}`,
          {
            attendance_status:
              form.attendance_status,
            check_in_time:
              form.check_in_time || null,
            check_out_time:
              form.check_out_time || null,
          }
        );
      }

      closeForm();

      setSuccess(
        editingRecord
          ? "Attendance record updated successfully."
          : "Attendance record created successfully."
      );

      await fetchData();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
        "Unable to save attendance record."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record) => {
    const confirmed = window.confirm(
      `Delete attendance record for ${getDriverName(
        record.driver_id
      )} on ${formatDate(record.date)}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await api.delete(
        `/driver-attendance/${record.id}`
      );

      setSuccess(
        "Attendance record deleted successfully."
      );

      await fetchData();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
        "Unable to delete attendance record."
      );
    }
  };

  const formatDate = (value) => {
    if (!value) {
      return "—";
    }

    return new Date(
      `${value}T00:00:00`
    ).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (value) => {
    if (!value) {
      return "—";
    }

    return value.slice(0, 5);
  };

  const getStatusClass = (status) => {
    return status
      .toLowerCase()
      .replace(/\s+/g, "-");
  };

  if (loading) {
    return (
      <div className="empty-state">
        Loading attendance records...
      </div>
    );
  }

  return (
    <div>

      <div className="page-heading">

        <div>
          <h1>Driver Attendance</h1>

          <p>
            Track driver attendance and working hours.
          </p>
        </div>

        <div className="page-heading-actions">

          <button
            className="secondary-button"
            onClick={fetchData}
          >
            ↻ Refresh
          </button>

          <button
            className="primary-button"
            onClick={openAddForm}
          >
            + Add Attendance
          </button>

        </div>

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


      <div className="table-card">

        <div className="table-card-header">

          <div>
            <h2>
              Attendance Records
            </h2>

            <p>
              {records.length} record
              {records.length !== 1 ? "s" : ""}
            </p>
          </div>

        </div>


        {records.length === 0 ? (

          <div className="empty-table">

            <div
              style={{
                fontSize: "30px",
                marginBottom: "10px",
              }}
            >
              👤
            </div>

            <div>
              No attendance records found.
            </div>

            <div
              style={{
                marginTop: "6px",
                fontSize: "12px",
              }}
            >
              Add an attendance record to get started.
            </div>

          </div>

        ) : (

          <div className="table-wrapper">

            <table>

              <thead>

                <tr>
                  <th>Driver</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Actions</th>
                </tr>

              </thead>

              <tbody>

                {records.map((record) => (

                  <tr key={record.id}>

                    <td>
                      <strong>
                        {getDriverName(
                          record.driver_id
                        )}
                      </strong>
                    </td>

                    <td>
                      {formatDate(record.date)}
                    </td>

                    <td>

                      <span
                        className={`status-badge attendance-${getStatusClass(
                          record.attendance_status
                        )}`}
                      >
                        {record.attendance_status}
                      </span>

                    </td>

                    <td>
                      {formatTime(
                        record.check_in_time
                      )}
                    </td>

                    <td>
                      {formatTime(
                        record.check_out_time
                      )}
                    </td>

                    <td>

                      <div className="table-actions">

                        <button
                          className="secondary-button"
                          onClick={() =>
                            openEditForm(record)
                          }
                        >
                          Edit
                        </button>

                        <button
                          className="danger-button"
                          onClick={() =>
                            handleDelete(record)
                          }
                        >
                          Delete
                        </button>

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>


      {showForm && (

        <div className="modal-backdrop">

          <div className="vehicle-modal">

            <div className="modal-header">

              <div>

                <h2>
                  {editingRecord
                    ? "Edit Attendance"
                    : "Add Attendance"}
                </h2>

                <p>
                  Record the driver's attendance.
                </p>

              </div>

              <button
                className="modal-close"
                onClick={closeForm}
                disabled={saving}
              >
                ×
              </button>

            </div>


            <form
              className="vehicle-form"
              onSubmit={handleSubmit}
            >

              <div className="form-field">

                <label>
                  Driver
                </label>

                <select
                  name="driver_id"
                  value={form.driver_id}
                  onChange={handleChange}
                  className="form-select"
                  disabled={Boolean(editingRecord)}
                  required
                >

                  <option value="">
                    Select driver
                  </option>

                  {(editingRecord
                    ? drivers.filter(
                        (driver) =>
                          driver.id ===
                          editingRecord.driver_id
                      )
                    : activeDrivers
                  ).map((driver) => (

                    <option
                      key={driver.id}
                      value={driver.id}
                    >
                      {driver.name}
                      {" — "}
                      {driver.license_number}
                    </option>

                  ))}

                </select>

              </div>


              <div className="form-field">

                <label>
                  Date
                </label>

                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  className="form-input"
                  disabled={Boolean(editingRecord)}
                  required
                />

              </div>


              <div className="form-field">

                <label>
                  Attendance Status
                </label>

                <select
                  name="attendance_status"
                  value={form.attendance_status}
                  onChange={handleChange}
                  className="form-select"
                  required
                >

                  <option value="Present">
                    Present
                  </option>

                  <option value="Absent">
                    Absent
                  </option>

                  <option value="Leave">
                    Leave
                  </option>

                </select>

              </div>


              <div className="form-row">

                <div className="form-field">

                  <label>
                    Check-in Time
                  </label>

                  <input
                    type="time"
                    name="check_in_time"
                    value={form.check_in_time}
                    onChange={handleChange}
                    className="form-input"
                  />

                </div>


                <div className="form-field">

                  <label>
                    Check-out Time
                  </label>

                  <input
                    type="time"
                    name="check_out_time"
                    value={form.check_out_time}
                    onChange={handleChange}
                    className="form-input"
                  />

                </div>

              </div>


              <div className="modal-actions">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingRecord
                      ? "Update Attendance"
                      : "Add Attendance"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default DriverAttendance;