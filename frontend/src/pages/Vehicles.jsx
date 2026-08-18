import { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import { toast } from "react-toastify";

import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaSearch,
  FaTruck,
  FaCheckCircle,
  FaTools,
  FaShippingFast,
  FaTimes,
  FaFilter,
  FaBoxes,
} from "react-icons/fa";

function Vehicles() {
  // =========================================================
  // DEFAULT VEHICLE
  // =========================================================

  const emptyVehicle = {
    vehicle_number: "",
    vehicle_type: "",
    model: "",
    capacity: "",
    status: "Available",
  };

  // =========================================================
  // STATES
  // =========================================================

  const [vehicles, setVehicles] = useState([]);

  const [vehicle, setVehicle] =
    useState(emptyVehicle);

  const [editVehicle, setEditVehicle] =
    useState(emptyVehicle);

  const [editId, setEditId] = useState(null);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [showAddModal, setShowAddModal] =
    useState(false);

  const [showEditModal, setShowEditModal] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  // =========================================================
  // LOAD VEHICLES
  // =========================================================

  useEffect(() => {
    fetchVehicles();
  }, []);

  // =========================================================
  // GET VEHICLES
  // =========================================================

  const fetchVehicles = async () => {
    try {
      setLoading(true);

      const response =
        await api.get("/vehicles");

      setVehicles(response.data || []);
    } catch (error) {
      console.error(
        "Fetch Vehicles Error:",
        error
      );

      toast.error(
        "Failed to load vehicles"
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // FORM CHANGE
  // =========================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setVehicle((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =========================================================
  // EDIT FORM CHANGE
  // =========================================================

  const handleEditChange = (e) => {
    const { name, value } = e.target;

    setEditVehicle((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =========================================================
  // ADD VEHICLE
  // =========================================================

  const addVehicle = async (e) => {
    e.preventDefault();

    try {
      await api.post(
        "/vehicles",
        {
          ...vehicle,
          capacity: Number(vehicle.capacity),
        }
      );

      toast.success(
        "Vehicle added successfully"
      );

      setVehicle(emptyVehicle);

      setShowAddModal(false);

      await fetchVehicles();
    } catch (error) {
      console.error(
        "Add Vehicle Error:",
        error
      );

      const message =
        error?.response?.data?.detail ||
        "Failed to add vehicle";

      toast.error(message);
    }
  };

  // =========================================================
  // OPEN EDIT
  // =========================================================

  const openEditModal = (v) => {
    setEditVehicle({
      vehicle_number:
        v.vehicle_number || "",

      vehicle_type:
        v.vehicle_type || "",

      model:
        v.model || "",

      capacity:
        v.capacity ?? "",

      status:
        v.status || "Available",
    });

    setEditId(v.id);

    setShowEditModal(true);
  };

  // =========================================================
  // UPDATE VEHICLE
  // =========================================================

  const updateVehicle = async (e) => {
    e.preventDefault();

    if (!editId) {
      toast.error(
        "Vehicle ID is missing"
      );

      return;
    }

    try {
      await api.put(
        `/vehicles/${editId}`,
        {
          ...editVehicle,
          capacity: Number(
            editVehicle.capacity
          ),
        }
      );

      toast.success(
        "Vehicle updated successfully"
      );

      setShowEditModal(false);

      setEditId(null);

      setEditVehicle(emptyVehicle);

      await fetchVehicles();
    } catch (error) {
      console.error(
        "Update Vehicle Error:",
        error
      );

      const message =
        error?.response?.data?.detail ||
        "Vehicle update failed";

      toast.error(message);
    }
  };

  // =========================================================
  // DELETE VEHICLE
  // =========================================================

  const deleteVehicle = async (id) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this vehicle?"
      );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(
        `/vehicles/${id}`
      );

      toast.success(
        "Vehicle deleted successfully"
      );

      await fetchVehicles();
    } catch (error) {
      console.error(
        "Delete Vehicle Error:",
        error
      );

      const message =
        error?.response?.data?.detail ||
        "Delete failed";

      toast.error(message);
    }
  };

  // =========================================================
  // SEARCH + FILTER
  // =========================================================

  const filteredVehicles = useMemo(() => {
    const searchText =
      search.toLowerCase().trim();

    return vehicles.filter((v) => {
      const matchesSearch =
        !searchText ||
        v.vehicle_number
          ?.toLowerCase()
          .includes(searchText) ||
        v.vehicle_type
          ?.toLowerCase()
          .includes(searchText) ||
        v.model
          ?.toLowerCase()
          .includes(searchText);

      const matchesStatus =
        statusFilter === "All" ||
        v.status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    vehicles,
    search,
    statusFilter,
  ]);

  // =========================================================
  // STATISTICS
  // =========================================================

  const vehicleStats = useMemo(() => {
    const total = vehicles.length;

    const available =
      vehicles.filter(
        (v) =>
          v.status === "Available"
      ).length;

    const busy =
      vehicles.filter(
        (v) =>
          v.status === "Busy"
      ).length;

    const maintenance =
      vehicles.filter(
        (v) =>
          v.status === "Maintenance"
      ).length;

    const outOfService =
      vehicles.filter(
        (v) =>
          v.status === "Out of Service"
      ).length;

    return {
      total,
      available,
      busy,
      maintenance,
      outOfService,
    };
  }, [vehicles]);

  // =========================================================
  // STATUS
  // =========================================================

  const getStatusClass = (status) => {
    switch (status) {
      case "Available":
        return "vehicle-status-badge available";

      case "Busy":
        return "vehicle-status-badge busy";

      case "Maintenance":
        return "vehicle-status-badge maintenance";

      case "Out of Service":
        return "vehicle-status-badge out";

      default:
        return "vehicle-status-badge";
    }
  };

  // =========================================================
  // STATUS ICON
  // =========================================================

  const getStatusIcon = (status) => {
    switch (status) {
      case "Available":
        return <FaCheckCircle />;

      case "Busy":
        return <FaShippingFast />;

      case "Maintenance":
        return <FaTools />;

      case "Out of Service":
        return <FaTruck />;

      default:
        return <FaTruck />;
    }
  };

  // =========================================================
  // CLOSE MODALS
  // =========================================================

  const closeAddModal = () => {
    setShowAddModal(false);
    setVehicle(emptyVehicle);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditId(null);
    setEditVehicle(emptyVehicle);
  };

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <main className="vehicles-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <section className="vehicles-page-header">

        <div>
          <div className="vehicles-heading-row">

            <div className="vehicles-heading-icon">
              <FaTruck />
            </div>

            <div>
              <h1>
                Vehicle Management
              </h1>

              <p>
                Manage and monitor your
                entire fleet from one place.
              </p>
            </div>

          </div>
        </div>

        <button
          className="vehicles-primary-btn"
          onClick={() =>
            setShowAddModal(true)
          }
        >
          <FaPlus />
          Add Vehicle
        </button>

      </section>


      {/* =====================================================
          SUMMARY CARDS
      ===================================================== */}

      <section className="vehicle-summary-grid">

        <div className="vehicle-summary-card">

          <div className="vehicle-summary-icon blue">
            <FaTruck />
          </div>

          <div>
            <span>
              Total Vehicles
            </span>

            <strong>
              {vehicleStats.total}
            </strong>

            <small>
              Registered vehicles
            </small>
          </div>

        </div>


        <div className="vehicle-summary-card">

          <div className="vehicle-summary-icon green">
            <FaCheckCircle />
          </div>

          <div>
            <span>
              Available
            </span>

            <strong>
              {vehicleStats.available}
            </strong>

            <small>
              Ready for assignment
            </small>
          </div>

        </div>


        <div className="vehicle-summary-card">

          <div className="vehicle-summary-icon purple">
            <FaShippingFast />
          </div>

          <div>
            <span>
              Busy
            </span>

            <strong>
              {vehicleStats.busy}
            </strong>

            <small>
              Currently assigned
            </small>
          </div>

        </div>


        <div className="vehicle-summary-card">

          <div className="vehicle-summary-icon orange">
            <FaTools />
          </div>

          <div>
            <span>
              Maintenance
            </span>

            <strong>
              {vehicleStats.maintenance}
            </strong>

            <small>
              Requiring service
            </small>
          </div>

        </div>

      </section>


      {/* =====================================================
          TABLE CARD
      ===================================================== */}

      <section className="vehicles-content-card">

        {/* CARD HEADER */}

        <div className="vehicles-card-header">

          <div>
            <h2>
              All Vehicles
            </h2>

            <p>
              {filteredVehicles.length}
              {" "}
              vehicles displayed
            </p>
          </div>

          <div className="vehicles-card-total">

            <FaBoxes />

            <span>
              {vehicles.length} Total
            </span>

          </div>

        </div>


        {/* SEARCH / FILTER */}

        <div className="vehicles-toolbar">

          <div className="vehicles-search-box">

            <FaSearch />

            <input
              type="text"
              placeholder="Search by vehicle number, type or model..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

            {search && (
              <button
                className="clear-search-btn"
                onClick={() =>
                  setSearch("")
                }
                type="button"
              >
                <FaTimes />
              </button>
            )}

          </div>


          <div className="vehicles-filter-box">

            <FaFilter />

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value
                )
              }
            >
              <option value="All">
                All Status
              </option>

              <option value="Available">
                Available
              </option>

              <option value="Busy">
                Busy
              </option>

              <option value="Maintenance">
                Maintenance
              </option>

              <option value="Out of Service">
                Out of Service
              </option>
            </select>

          </div>

        </div>


        {/* TABLE */}

        <div className="vehicles-table-wrapper">

          <table className="professional-vehicles-table">

            <thead>

              <tr>

                <th>
                  ID
                </th>

                <th>
                  Vehicle
                </th>

                <th>
                  Type
                </th>

                <th>
                  Model
                </th>

                <th>
                  Capacity
                </th>

                <th>
                  Status
                </th>

                <th className="actions-column">
                  Actions
                </th>

              </tr>

            </thead>


            <tbody>

              {loading ? (

                <tr>
                  <td
                    colSpan="7"
                    className="vehicles-loading"
                  >
                    <div className="vehicles-spinner" />

                    <span>
                      Loading vehicles...
                    </span>
                  </td>
                </tr>

              ) : filteredVehicles.length === 0 ? (

                <tr>

                  <td
                    colSpan="7"
                    className="vehicles-empty"
                  >

                    <div className="vehicles-empty-icon">
                      <FaTruck />
                    </div>

                    <h3>
                      No vehicles found
                    </h3>

                    <p>
                      Try changing your
                      search or filter.
                    </p>

                  </td>

                </tr>

              ) : (

                filteredVehicles.map((v) => (

                  <tr key={v.id}>

                    {/* ID */}

                    <td>

                      <span className="vehicle-id">
                        #{v.id}
                      </span>

                    </td>


                    {/* VEHICLE */}

                    <td>

                      <div className="vehicle-cell">

                        <div className="vehicle-table-icon">
                          <FaTruck />
                        </div>

                        <div>

                          <strong>
                            {v.vehicle_number}
                          </strong>

                          <small>
                            Fleet Vehicle
                          </small>

                        </div>

                      </div>

                    </td>


                    {/* TYPE */}

                    <td>

                      <span className="vehicle-type-text">
                        {v.vehicle_type ||
                          "—"}
                      </span>

                    </td>


                    {/* MODEL */}

                    <td>

                      <span className="vehicle-model-text">
                        {v.model || "—"}
                      </span>

                    </td>


                    {/* CAPACITY */}

                    <td>

                      <strong className="vehicle-capacity">
                        {v.capacity}
                        {" "}
                        Kg
                      </strong>

                    </td>


                    {/* STATUS */}

                    <td>

                      <span
                        className={getStatusClass(
                          v.status
                        )}
                      >

                        {getStatusIcon(
                          v.status
                        )}

                        {v.status}

                      </span>

                    </td>


                    {/* ACTIONS */}

                    <td>

                      <div className="vehicle-actions">

                        <button
                          type="button"
                          className="vehicle-edit-action"
                          onClick={() =>
                            openEditModal(v)
                          }
                          title="Edit vehicle"
                        >

                          <FaEdit />

                          <span>
                            Edit
                          </span>

                        </button>


                        <button
                          type="button"
                          className="vehicle-delete-action"
                          onClick={() =>
                            deleteVehicle(v.id)
                          }
                          title="Delete vehicle"
                        >

                          <FaTrash />

                          <span>
                            Delete
                          </span>

                        </button>

                      </div>

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>


        {/* FOOTER */}

        <div className="vehicles-table-footer">

          <span>
            Showing{" "}
            <strong>
              {filteredVehicles.length}
            </strong>{" "}
            of{" "}
            <strong>
              {vehicles.length}
            </strong>{" "}
            vehicles
          </span>

          <span className="vehicle-footer-status">
            <span />
            Fleet data synced
          </span>

        </div>

      </section>


      {/* =====================================================
          ADD VEHICLE MODAL
      ===================================================== */}

      {showAddModal && (

        <div
          className="vehicle-modal-overlay"
          onMouseDown={closeAddModal}
        >

          <div
            className="professional-vehicle-modal"
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >

            <div className="vehicle-modal-header">

              <div className="vehicle-modal-title">

                <div className="vehicle-modal-icon blue">
                  <FaPlus />
                </div>

                <div>
                  <h2>
                    Add Vehicle
                  </h2>

                  <p>
                    Register a new fleet vehicle
                  </p>
                </div>

              </div>

              <button
                type="button"
                className="vehicle-modal-close"
                onClick={closeAddModal}
              >
                <FaTimes />
              </button>

            </div>


            <form
              onSubmit={addVehicle}
              className="vehicle-form"
            >

              <div className="vehicle-form-grid">

                <div className="vehicle-form-group">

                  <label>
                    Vehicle Number
                  </label>

                  <input
                    type="text"
                    name="vehicle_number"
                    value={
                      vehicle.vehicle_number
                    }
                    onChange={handleChange}
                    placeholder="AP39AB1234"
                    required
                  />

                </div>


                <div className="vehicle-form-group">

                  <label>
                    Vehicle Type
                  </label>

                  <input
                    type="text"
                    name="vehicle_type"
                    value={
                      vehicle.vehicle_type
                    }
                    onChange={handleChange}
                    placeholder="Truck"
                    required
                  />

                </div>


                <div className="vehicle-form-group">

                  <label>
                    Model
                  </label>

                  <input
                    type="text"
                    name="model"
                    value={
                      vehicle.model
                    }
                    onChange={handleChange}
                    placeholder="Tata Ace"
                    required
                  />

                </div>


                <div className="vehicle-form-group">

                  <label>
                    Capacity
                  </label>

                  <div className="vehicle-input-with-unit">

                    <input
                      type="number"
                      name="capacity"
                      value={
                        vehicle.capacity
                      }
                      onChange={handleChange}
                      placeholder="5000"
                      min="0"
                      required
                    />

                    <span>
                      Kg
                    </span>

                  </div>

                </div>

              </div>


              <div className="vehicle-form-group">

                <label>
                  Status
                </label>

                <select
                  name="status"
                  value={
                    vehicle.status
                  }
                  onChange={handleChange}
                >

                  <option value="Available">
                    Available
                  </option>

                  <option value="Busy">
                    Busy
                  </option>

                  <option value="Maintenance">
                    Maintenance
                  </option>

                  <option value="Out of Service">
                    Out of Service
                  </option>

                </select>

              </div>


              <div className="vehicle-modal-footer">

                <button
                  type="button"
                  className="vehicle-cancel-btn"
                  onClick={closeAddModal}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="vehicles-primary-btn"
                >
                  <FaPlus />
                  Save Vehicle
                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* =====================================================
          EDIT VEHICLE MODAL
      ===================================================== */}

      {showEditModal && (

        <div
          className="vehicle-modal-overlay"
          onMouseDown={closeEditModal}
        >

          <div
            className="professional-vehicle-modal"
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >

            <div className="vehicle-modal-header">

              <div className="vehicle-modal-title">

                <div className="vehicle-modal-icon purple">
                  <FaEdit />
                </div>

                <div>
                  <h2>
                    Edit Vehicle
                  </h2>

                  <p>
                    Update vehicle information
                  </p>
                </div>

              </div>

              <button
                type="button"
                className="vehicle-modal-close"
                onClick={closeEditModal}
              >
                <FaTimes />
              </button>

            </div>


            <form
              onSubmit={updateVehicle}
              className="vehicle-form"
            >

              <div className="vehicle-form-grid">

                <div className="vehicle-form-group">

                  <label>
                    Vehicle Number
                  </label>

                  <input
                    type="text"
                    name="vehicle_number"
                    value={
                      editVehicle.vehicle_number
                    }
                    onChange={
                      handleEditChange
                    }
                    required
                  />

                </div>


                <div className="vehicle-form-group">

                  <label>
                    Vehicle Type
                  </label>

                  <input
                    type="text"
                    name="vehicle_type"
                    value={
                      editVehicle.vehicle_type
                    }
                    onChange={
                      handleEditChange
                    }
                    required
                  />

                </div>


                <div className="vehicle-form-group">

                  <label>
                    Model
                  </label>

                  <input
                    type="text"
                    name="model"
                    value={
                      editVehicle.model
                    }
                    onChange={
                      handleEditChange
                    }
                    required
                  />

                </div>


                <div className="vehicle-form-group">

                  <label>
                    Capacity
                  </label>

                  <div className="vehicle-input-with-unit">

                    <input
                      type="number"
                      name="capacity"
                      value={
                        editVehicle.capacity
                      }
                      onChange={
                        handleEditChange
                      }
                      min="0"
                      required
                    />

                    <span>
                      Kg
                    </span>

                  </div>

                </div>

              </div>


              <div className="vehicle-form-group">

                <label>
                  Status
                </label>

                <select
                  name="status"
                  value={
                    editVehicle.status
                  }
                  onChange={
                    handleEditChange
                  }
                >

                  <option value="Available">
                    Available
                  </option>

                  <option value="Busy">
                    Busy
                  </option>

                  <option value="Maintenance">
                    Maintenance
                  </option>

                  <option value="Out of Service">
                    Out of Service
                  </option>

                </select>

              </div>


              <div className="vehicle-modal-footer">

                <button
                  type="button"
                  className="vehicle-cancel-btn"
                  onClick={closeEditModal}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="vehicle-update-btn"
                >
                  <FaEdit />
                  Update Vehicle
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </main>
  );
}

export default Vehicles;