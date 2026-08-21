import { useEffect, useMemo, useState } from "react";
import { FaPlus, FaSearch, FaTruck } from "react-icons/fa";
import VehicleTable from "../components/VehicleTable";
import AddVehicleModal from "../components/AddVehicleModal";
import { getVehicles } from "../services/vehicleService";
import { getDriverAssignments } from "../services/driverAssignmentService";
import { getDrivers } from "../services/driverService";

function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [vehicleToEdit, setVehicleToEdit] = useState(null);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      setError("");

      const vehicleData = await getVehicles();
      setVehicles(vehicleData || []);

      // Driver information is supplementary.
      // If it fails, the vehicle registry still works.
      try {
        const [assignmentData, driverData] = await Promise.all([
          getDriverAssignments(),
          getDrivers(),
        ]);

        setAssignments(assignmentData || []);
        setDrivers(driverData || []);
      } catch (assignmentError) {
        console.warn(
          "Driver assignment data could not be loaded.",
          assignmentError
        );

        setAssignments([]);
        setDrivers([]);
      }
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Failed to load vehicles. Please check the backend and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  // Create a quick driver lookup by driver ID
  const driverById = useMemo(() => {
    return drivers.reduce((map, driver) => {
      map[driver.id] = driver;
      return map;
    }, {});
  }, [drivers]);

  // Find the currently assigned driver for every vehicle
  const assignedDriverByVehicleId = useMemo(() => {
    const map = {};

    assignments
      .filter(
        (assignment) =>
          assignment.assignment_status === "ASSIGNED"
      )
      .forEach((assignment) => {
        const driver = driverById[assignment.driver_id];

        if (driver) {
          map[assignment.vehicle_id] = driver;
        }
      });

    return map;
  }, [assignments, driverById]);

  // Frontend search
  const filteredVehicles = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) {
      return vehicles;
    }

    return vehicles.filter((vehicle) => {
      const driver =
        assignedDriverByVehicleId[vehicle.id];

      return [
        vehicle.vehicle_number,
        vehicle.vehicle_type,
        vehicle.fuel_type,
        vehicle.status,
        vehicle.model,
        vehicle.manufacturer,
        driver?.name,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(term)
        );
    });
  }, [
    vehicles,
    searchTerm,
    assignedDriverByVehicleId,
  ]);

  const handleEdit = (vehicle) => {
    setVehicleToEdit(vehicle);
    setShowModal(true);
  };

  const handleRegister = () => {
    setVehicleToEdit(null);
    setShowModal(true);
  };

  const handleVehicleSaved = async () => {
    setShowModal(false);
    setVehicleToEdit(null);

    await loadVehicles();
  };

  const handleVehicleDeleted = (id) => {
    setVehicles((current) =>
      current.filter((vehicle) => vehicle.id !== id)
    );
  };

  return (
    <div className="min-h-full bg-slate-950 text-slate-100">

      {/* PAGE HEADER */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between mb-8">

        <div>

          <div className="flex items-center gap-3 mb-2">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <FaTruck />
            </div>

            <span className="text-sm font-medium uppercase tracking-wider text-blue-400">
              Fleet Operations
            </span>

          </div>

          <h1 className="text-3xl font-bold tracking-tight text-white">
            Fleet Registry
          </h1>

          <p className="mt-2 text-slate-400">
            Track and manage your vehicles, transport capacity,
            and driver assignments.
          </p>

        </div>

        <button
          onClick={handleRegister}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-500"
        >
          <FaPlus size={13} />
          Register Vehicle
        </button>

      </div>

      {/* REGISTRY CARD */}
      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl shadow-black/10">

        {/* TOOLBAR */}
        <div className="flex flex-col gap-4 border-b border-slate-800 p-5 sm:flex-row sm:items-center sm:justify-between">

          <div className="relative w-full sm:max-w-md">

            <FaSearch
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              size={14}
            />

            <input
              type="text"
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(e.target.value)
              }
              placeholder="Search by plate, type, driver..."
              className="w-full rounded-xl border border-slate-700 bg-slate-800/70 py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-slate-500 transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            />

          </div>

          <p className="text-sm text-slate-400">
            Showing{" "}
            <span className="font-semibold text-slate-200">
              {filteredVehicles.length}
            </span>{" "}
            {filteredVehicles.length === 1
              ? "vehicle"
              : "vehicles"}
          </p>

        </div>

        {/* TABLE / LOADING / ERROR */}
        {loading ? (

          <div className="flex min-h-72 items-center justify-center p-8">

            <div className="text-center">

              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500" />

              <p className="text-sm text-slate-400">
                Loading vehicle registry...
              </p>

            </div>

          </div>

        ) : error ? (

          <div className="m-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">

            {error}

            <button
              onClick={loadVehicles}
              className="ml-3 font-semibold underline hover:no-underline"
            >
              Retry
            </button>

          </div>

        ) : (

          <VehicleTable
            vehicles={filteredVehicles}
            assignedDriverByVehicleId={
              assignedDriverByVehicleId
            }
            onEdit={handleEdit}
            onVehicleDeleted={handleVehicleDeleted}
          />

        )}

      </section>

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <AddVehicleModal
          onClose={() => {
            setShowModal(false);
            setVehicleToEdit(null);
          }}
          onSaved={handleVehicleSaved}
          vehicleToEdit={vehicleToEdit}
        />
      )}

    </div>
  );
}

export default Vehicles;