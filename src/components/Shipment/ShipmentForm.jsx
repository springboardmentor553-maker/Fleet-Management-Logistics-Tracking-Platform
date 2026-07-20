import { useState, useEffect } from "react";
import api from "../../services/api";
import "./Shipment.css";

function ShipmentForm({
  selectedShipment,

  fetchShipments,

  setSelectedShipment,
}) {
  const [formData, setFormData] = useState({
    sender_name: "",

    receiver_name: "",

    pickup_location: "",

    delivery_location: "",

    current_status: "Created",

    weight: "",

    assigned_driver_id: "",

    assigned_vehicle_id: "",
  });

  useEffect(() => {
    if (selectedShipment) {
      setFormData({
        sender_name: selectedShipment.sender_name || "",

        receiver_name: selectedShipment.receiver_name || "",

        pickup_location: selectedShipment.pickup_location || "",

        delivery_location: selectedShipment.delivery_location || "",

        current_status: selectedShipment.current_status || "Created",

        weight: selectedShipment.weight || "",

        assigned_driver_id: selectedShipment.assigned_driver_id || "",

        assigned_vehicle_id: selectedShipment.assigned_vehicle_id || "",
      });
    } else {
      resetForm();
    }
  }, [selectedShipment]);

  const resetForm = () => {
    setFormData({
      sender_name: "",

      receiver_name: "",

      pickup_location: "",

      delivery_location: "",

      current_status: "Created",

      weight: "",

      assigned_driver_id: "",

      assigned_vehicle_id: "",
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
      sender_name: formData.sender_name,

      receiver_name: formData.receiver_name,

      pickup_location: formData.pickup_location,

      delivery_location: formData.delivery_location,

      current_status: formData.current_status,

      weight: Number(formData.weight),

      assigned_driver_id: Number(formData.assigned_driver_id),

      assigned_vehicle_id: Number(formData.assigned_vehicle_id),
    };

    try {
      if (selectedShipment) {
        await api.put(
          `/shipments/${selectedShipment.id}`,

          shipmentData,
        );

        alert("Shipment Updated Successfully");
      } else {
        await api.post(
          "/shipments",

          shipmentData,
        );

        alert("Shipment Added Successfully");
      }

      fetchShipments();

      resetForm();

      if (setSelectedShipment) {
        setSelectedShipment(null);
      }
    } catch (error) {
      console.log(error);

      alert("Something went wrong!");
    }
  };

  return (
    <div className="shipment-form-card">
      <h2>{selectedShipment ? "Update Shipment" : "Add New Shipment"}</h2>

      <form className="shipment-form" onSubmit={handleSubmit}>
        {/* Sender Name */}

        <div className="form-group">
          <label>Sender Name</label>

          <input
            type="text"
            name="sender_name"
            placeholder="Enter Sender Name"
            value={formData.sender_name}
            onChange={handleChange}
            required
          />
        </div>

        {/* Receiver Name */}

        <div className="form-group">
          <label>Receiver Name</label>

          <input
            type="text"
            name="receiver_name"
            placeholder="Enter Receiver Name"
            value={formData.receiver_name}
            onChange={handleChange}
            required
          />
        </div>

        {/* Pickup Location */}

        <div className="form-group">
          <label>Pickup Location</label>

          <input
            type="text"
            name="pickup_location"
            placeholder="Enter Pickup Location"
            value={formData.pickup_location}
            onChange={handleChange}
            required
          />
        </div>

        {/* Delivery Location */}

        <div className="form-group">
          <label>Delivery Location</label>

          <input
            type="text"
            name="delivery_location"
            placeholder="Enter Delivery Location"
            value={formData.delivery_location}
            onChange={handleChange}
            required
          />
        </div>

        {/* Weight */}

        <div className="form-group">
          <label>Weight (kg)</label>

          <input
            type="number"
            step="0.01"
            name="weight"
            placeholder="Enter Weight"
            value={formData.weight}
            onChange={handleChange}
            required
          />
        </div>

        {/* Status */}

        <div className="form-group">
          <label>Status</label>

          <select
            name="current_status"
            value={formData.current_status}
            onChange={handleChange}
          >
            <option value="Created">Created</option>

            <option value="Assigned">Assigned</option>

            <option value="In Transit">In Transit</option>

            <option value="Delayed">Delayed</option>

            <option value="Delivered">Delivered</option>

            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        {/* Driver ID */}

        <div className="form-group">
          <label>Assigned Driver ID</label>

          <input
            type="number"
            name="assigned_driver_id"
            placeholder="Enter Driver ID"
            value={formData.assigned_driver_id}
            onChange={handleChange}
          />
        </div>

        {/* Vehicle ID */}

        <div className="form-group">
          <label>Assigned Vehicle ID</label>

          <input
            type="number"
            name="assigned_vehicle_id"
            placeholder="Enter Vehicle ID"
            value={formData.assigned_vehicle_id}
            onChange={handleChange}
          />
        </div>

        <div className="button-group">
          <button type="submit" className="save-btn">
            {selectedShipment ? "Update Shipment" : "Add Shipment"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ShipmentForm;
