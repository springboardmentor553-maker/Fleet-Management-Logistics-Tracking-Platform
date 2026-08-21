import {
  FaEdit,
  FaTrash,
  FaUser,
} from "react-icons/fa";

import { deleteVehicle } from "../services/vehicleService";

const getStatusClasses = (status) => {
  const normalized = String(
    status || ""
  ).toLowerCase();

  if (normalized === "available") {
    return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  }

  if (
    normalized === "on trip" ||
    normalized === "assigned"
  ) {
    return "bg-blue-500/10 text-blue-400 border-blue-500/20";
  }

  if (normalized === "maintenance") {
    return "bg-orange-500/10 text-orange-400 border-orange-500/20";
  }

  return "bg-slate-700/50 text-slate-400 border-slate-600";
};

function VehicleTable({
  vehicles,
  assignedDriverByVehicleId,
  onEdit,
  onVehicleDeleted,
}) {

  const handleDelete = async (id) => {

    if (
      !window.confirm(
        "Delete this vehicle? This action cannot be undone."
      )
    ) {
      return;
    }

    try {

      await deleteVehicle(id);

      onVehicleDeleted(id);

    } catch (error) {

      console.error(error);

      alert(
        error.response?.data?.detail ||
          "Failed to delete vehicle."
      );
    }
  };

  // EMPTY STATE
  if (vehicles.length === 0) {
    return (
      <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">

        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-slate-500">
          <FaUser size={20} />
        </div>

        <h3 className="text-base font-semibold text-slate-200">
          No vehicles found
        </h3>

        <p className="mt-1 max-w-sm text-sm text-slate-500">
          Try changing your search or register a new
          vehicle to add it to the fleet registry.
        </p>

      </div>
    );
  }

  return (
    <div className="overflow-x-auto">

      <table className="min-w-[1050px] w-full">

        <thead>

          <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wider text-slate-500">

            <th className="px-5 py-4 font-semibold">
              Vehicle ID / Plate
            </th>

            <th className="px-5 py-4 font-semibold">
              Type
            </th>

            <th className="px-5 py-4 font-semibold">
              Capacity
            </th>

            <th className="px-5 py-4 font-semibold">
              Fuel Type
            </th>

            <th className="px-5 py-4 font-semibold">
              Driver
            </th>

            <th className="px-5 py-4 font-semibold">
              Status
            </th>

            <th className="px-5 py-4 text-right font-semibold">
              Actions
            </th>

          </tr>

        </thead>

        <tbody>

          {vehicles.map((vehicle) => {

            const driver =
              assignedDriverByVehicleId?.[
                vehicle.id
              ];

            return (
              <tr
                key={vehicle.id}
                className="border-b border-slate-800/80 transition hover:bg-slate-800/40 last:border-b-0"
              >

                {/* VEHICLE */}
                <td className="px-5 py-5">

                  <div>

                    <p className="font-semibold text-white">
                      {vehicle.vehicle_number}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Vehicle #{vehicle.id}
                    </p>

                  </div>

                </td>

                {/* TYPE */}
                <td className="px-5 py-5 text-sm text-slate-300">
                  {vehicle.vehicle_type || "—"}
                </td>

                {/* CAPACITY */}
                <td className="px-5 py-5 text-sm text-slate-300">

                  <span className="font-medium text-slate-200">
                    {vehicle.capacity?.toLocaleString() || 0}
                  </span>{" "}
                  kg

                </td>

                {/* FUEL */}
                <td className="px-5 py-5 text-sm text-slate-300">
                  {vehicle.fuel_type || "—"}
                </td>

                {/* DRIVER */}
                <td className="px-5 py-5">

                  {driver ? (

                    <div className="flex items-center gap-3">

                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400">
                        <FaUser size={12} />
                      </div>

                      <div>

                        <p className="text-sm font-medium text-slate-200">
                          {driver.name}
                        </p>

                        <p className="text-xs text-slate-500">
                          Assigned
                        </p>

                      </div>

                    </div>

                  ) : (

                    <span className="text-sm text-slate-500">
                      Unassigned
                    </span>

                  )}

                </td>

                {/* STATUS */}
                <td className="px-5 py-5">

                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getStatusClasses(
                      vehicle.status
                    )}`}
                  >
                    {vehicle.status || "Unknown"}
                  </span>

                </td>

                {/* ACTIONS */}
                <td className="px-5 py-5">

                  <div className="flex justify-end gap-2">

                    <button
                      onClick={() =>
                        onEdit(vehicle)
                      }
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-blue-400"
                    >
                      <FaEdit size={12} />
                      Edit
                    </button>

                    <button
                      onClick={() =>
                        handleDelete(vehicle.id)
                      }
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
                    >
                      <FaTrash size={11} />
                      Delete
                    </button>

                  </div>

                </td>

              </tr>
            );

          })}

        </tbody>

      </table>

    </div>
  );
}

export default VehicleTable;