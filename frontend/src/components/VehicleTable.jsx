import { deleteVehicle } from "../services/vehicleService";

function VehicleTable({
  vehicles,
  onEdit,
  onVehicleDeleted,
}) {

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this vehicle?")) return;

    try {
      await deleteVehicle(id);

      onVehicleDeleted(id);

    } catch (error) {
      console.error(error);
      alert("Failed to delete vehicle.");
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm mt-10 p-6">

      <h2 className="text-xl font-semibold mb-6">
        Recent Vehicles
      </h2>

      <table className="w-full">

        <thead className="border-b">

          <tr className="text-left text-slate-500">
            <th className="pb-3">Vehicle No.</th>
            <th className="pb-3">Type</th>
            <th className="pb-3">Capacity</th>
            <th className="pb-3">Fuel</th>
            <th className="pb-3">Status</th>
            <th className="pb-3">Actions</th>
          </tr>

        </thead>

        <tbody>

          {vehicles.map((vehicle) => (

            <tr
              key={vehicle.id}
              className="border-b last:border-none hover:bg-slate-50"
            >

              <td className="py-4">
                {vehicle.vehicle_number}
              </td>

              <td>{vehicle.vehicle_type}</td>

              <td>{vehicle.capacity} Tons</td>

              <td>{vehicle.fuel_type}</td>

              <td>{vehicle.status}</td>

              <td className="py-4">

                <div className="flex gap-2">

                  <button
                    onClick={() => onEdit(vehicle)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-lg"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDelete(vehicle.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg"
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
  );
}

export default VehicleTable;