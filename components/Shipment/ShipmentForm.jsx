import { useState, useEffect } from "react";
import api from "../../services/api";
import "./Shipment.css";

function ShipmentForm({
  selectedShipment,
  fetchShipments,
  setSelectedShipment,
}) {
  const [formData, setFormData] = useState({
    shipment_name: "",
    source: "",
    destination: "",
    status: "Created",
    vehicle_id: "",
  });

  useEffect(() => {
    if (selectedShipment) {
      setFormData({
        shipment_name: selectedShipment.shipment_name || "",
        source: selectedShipment.source || "",
        destination: selectedShipment.destination || "",
        status: selectedShipment.status || "Created",
        vehicle_id: selectedShipment.vehicle_id || "",
      });
    } else {
      resetForm();
    }
  }, [selectedShipment]);

  const resetForm = () => {
    setFormData({
      shipment_name: "",
      source: "",
      destination: "",
      status: "Created",
      vehicle_id: "",
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const shipmentData = {
      shipment_name: formData.shipment_name,
      source: formData.source,
      destination: formData.destination,
      status: formData.status,
      vehicle_id: Number(formData.vehicle_id),
    };

    try {
      if (selectedShipment) {
        await api.put(
          `/shipments/${selectedShipment.id}`,
          shipmentData
        );

        alert("Shipment Updated Successfully");
      } else {
        await api.post(
          "/shipments",
          shipmentData
        );

        alert("Shipment Added Successfully");
      }

      fetchShipments();

      resetForm();

      if (setSelectedShipment) {
        setSelectedShipment(null);
      }

    } catch (error) {

      console.error(error);

      alert("Something went wrong!");

    }
  };

  return (
    <div className="shipment-form-card">

      <h2>

        {selectedShipment
          ? "Update Shipment"
          : "Add New Shipment"}

      </h2>

      <form
        className="shipment-form"
        onSubmit={handleSubmit}
      >

        <div className="form-group">

          <label>Shipment Name</label>

          <input
            type="text"
            name="shipment_name"
            placeholder="Enter Shipment Name"
            value={formData.shipment_name}
            onChange={handleChange}
            required
          />

        </div>

        <div className="form-group">

          <label>Source</label>

          <input
            type="text"
            name="source"
            placeholder="Enter Source"
            value={formData.source}
            onChange={handleChange}
            required
          />

        </div>

        <div className="form-group">

          <label>Destination</label>

          <input
            type="text"
            name="destination"
            placeholder="Enter Destination"
            value={formData.destination}
            onChange={handleChange}
            required
          />

        </div>

        <div className="form-group">

          <label>Status</label>

          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
          >

            <option value="Created">
              Created
            </option>

            <option value="In Transit">
              In Transit
            </option>

            <option value="Delivered">
              Delivered
            </option>

          </select>

        </div>

        <div className="form-group">

          <label>Vehicle ID</label>

          <input
            type="number"
            name="vehicle_id"
            placeholder="Enter Vehicle ID"
            value={formData.vehicle_id}
            onChange={handleChange}
            required
          />

        </div>

        <div className="form-group button-group">

          <button
            type="submit"
            className="save-btn"
          >

            {selectedShipment
              ? "Update Shipment"
              : "Add Shipment"}

          </button>

        </div>

      </form>

    </div>
  );
}

export default ShipmentForm;