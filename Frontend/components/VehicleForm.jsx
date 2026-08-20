import { useState, useEffect } from "react";

export default function VehicleForm({
  onSubmit,
  editingVehicle,
}) {
  const [form, setForm] = useState({
    vehicle_number: "",
    vehicle_type: "",
    model: "",
    capacity: "",
    status: "Available",
  });

  useEffect(() => {
    if (editingVehicle) {
      setForm(editingVehicle);
    }
  }, [editingVehicle]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    onSubmit(form);

    setForm({
      vehicle_number: "",
      vehicle_type: "",
      model: "",
      capacity: "",
      status: "Available",
    });
  };

  return (
    <form onSubmit={handleSubmit}>

      <input
        name="vehicle_number"
        placeholder="Vehicle Number"
        value={form.vehicle_number}
        onChange={handleChange}
        required
      />

      <input
        name="vehicle_type"
        placeholder="Vehicle Type"
        value={form.vehicle_type}
        onChange={handleChange}
        required
      />

      <input
        name="model"
        placeholder="Model"
        value={form.model}
        onChange={handleChange}
        required
      />

      <input
        name="capacity"
        type="number"
        placeholder="Capacity"
        value={form.capacity}
        onChange={handleChange}
        required
      />

      <select
        name="status"
        value={form.status}
        onChange={handleChange}
      >
        <option>Available</option>
        <option>On Trip</option>
        <option>Maintenance</option>
        <option>Inactive</option>
      </select>

      <button type="submit">
        {editingVehicle ? "Update Vehicle" : "Add Vehicle"}
      </button>

    </form>
  );
}