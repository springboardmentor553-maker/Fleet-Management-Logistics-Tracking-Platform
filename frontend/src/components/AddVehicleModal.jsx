import { useState, useEffect } from "react";
import {
  addVehicle,
  updateVehicle,
} from "../services/vehicleService";

function AddVehicleModal({ onClose, vehicleToEdit }) {
  const [vehicle, setVehicle] = useState({
    vehicle_number: "",
    vehicle_type: "",
    capacity: "",
    status: "",
    fuel_type: "",
    model: "",
    manufacturer: "",
  });

  useEffect(() => {
    if (vehicleToEdit) {
      setVehicle(vehicleToEdit);
    }
  }, [vehicleToEdit]);

  const handleChange = (e) => {
    setVehicle({
      ...vehicle,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    try {
      if (vehicleToEdit) {
        await updateVehicle(vehicleToEdit.id, vehicle);
        alert("Vehicle updated successfully!");
      } else {
        await addVehicle(vehicle);
        alert("Vehicle added successfully!");
      }

      onClose();
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert("Operation failed.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8">

        <h2 className="text-2xl font-bold mb-6">
          {vehicleToEdit ? "Edit Vehicle" : "Add New Vehicle"}
        </h2>

        <div className="space-y-4">

          <input
            type="text"
            name="vehicle_number"
            placeholder="Vehicle Number"
            value={vehicle.vehicle_number}
            onChange={handleChange}
            className="w-full border rounded-lg p-3"
          />

          <input
            type="text"
            name="vehicle_type"
            placeholder="Vehicle Type"
            value={vehicle.vehicle_type}
            onChange={handleChange}
            className="w-full border rounded-lg p-3"
          />

          <input
            type="number"
            name="capacity"
            placeholder="Capacity"
            value={vehicle.capacity}
            onChange={handleChange}
            className="w-full border rounded-lg p-3"
          />

          <input
            type="text"
            name="status"
            placeholder="Status"
            value={vehicle.status}
            onChange={handleChange}
            className="w-full border rounded-lg p-3"
          />

          <input
            type="text"
            name="fuel_type"
            placeholder="Fuel Type"
            value={vehicle.fuel_type}
            onChange={handleChange}
            className="w-full border rounded-lg p-3"
          />

          <input
            type="text"
            name="model"
            placeholder="Model"
            value={vehicle.model}
            onChange={handleChange}
            className="w-full border rounded-lg p-3"
          />

          <input
            type="text"
            name="manufacturer"
            placeholder="Manufacturer"
            value={vehicle.manufacturer}
            onChange={handleChange}
            className="w-full border rounded-lg p-3"
          />

        </div>

        <div className="flex justify-end gap-4 mt-8">

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-gray-300 hover:bg-gray-400"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            {vehicleToEdit ? "Update Vehicle" : "Save Vehicle"}
          </button>

        </div>

      </div>

    </div>
  );
}

export default AddVehicleModal;