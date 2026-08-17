import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../services/api";

function AddShipment() {
  const navigate = useNavigate();

  const [shipment, setShipment] = useState({
    shipment_type: "",
    weight: "",
    driver_id: "",
    vehicle_id: "",
    eta: "",
    sender_name: "",
    receiver_name: "",
    pickup_location: "",
    delivery_location: "",
    current_status: "Assigned",
  });

  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    setShipment({
      ...shipment,
      [e.target.name]: e.target.value,
    });
  };

  const saveShipment = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      await api.post("/shipments", null, {
        params: {
          shipment_type: shipment.shipment_type,
          weight: shipment.weight,
          driver_id: shipment.driver_id,
          vehicle_id: shipment.vehicle_id,
          eta: shipment.eta,
          sender_name: shipment.sender_name,
          receiver_name: shipment.receiver_name,
          pickup_location: shipment.pickup_location,
          delivery_location: shipment.delivery_location,
          current_status: shipment.current_status,
        },
      });

      alert("Shipment Added Successfully");

      navigate("/shipments");
    } catch (err) {
      console.log(err);

      alert(
        err.response?.data?.detail ||
        "Failed to Add Shipment"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>

      {/* Header */}

      <div className="mb-8">

        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">
          Add Shipment
        </h1>

        <p className="text-slate-400 mt-2">
          Create and register a new shipment
        </p>

      </div>


      {/* Form */}

      <form
        onSubmit={saveShipment}
        className="bg-slate-900/75 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-2xl p-8"
      >

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Shipment Type */}

          <FormField
            label="Shipment Type"
            name="shipment_type"
            value={shipment.shipment_type}
            placeholder="e.g. Electronics"
            onChange={handleChange}
          />


          {/* Weight */}

          <FormField
            label="Weight"
            name="weight"
            type="number"
            value={shipment.weight}
            placeholder="Enter shipment weight"
            onChange={handleChange}
          />


          {/* Driver ID */}

          <FormField
            label="Driver ID"
            name="driver_id"
            type="number"
            value={shipment.driver_id}
            placeholder="Enter driver ID"
            onChange={handleChange}
          />


          {/* Vehicle ID */}

          <FormField
            label="Vehicle ID"
            name="vehicle_id"
            type="number"
            value={shipment.vehicle_id}
            placeholder="Enter vehicle ID"
            onChange={handleChange}
          />


          {/* ETA */}

          <FormField
            label="ETA"
            name="eta"
            value={shipment.eta}
            placeholder="Enter estimated arrival time"
            onChange={handleChange}
          />


          {/* Sender */}

          <FormField
            label="Sender Name"
            name="sender_name"
            value={shipment.sender_name}
            placeholder="Enter sender name"
            onChange={handleChange}
          />


          {/* Receiver */}

          <FormField
            label="Receiver Name"
            name="receiver_name"
            value={shipment.receiver_name}
            placeholder="Enter receiver name"
            onChange={handleChange}
          />


          {/* Pickup */}

          <FormField
            label="Pickup Location"
            name="pickup_location"
            value={shipment.pickup_location}
            placeholder="Enter pickup location"
            onChange={handleChange}
          />


          {/* Delivery */}

          <FormField
            label="Delivery Location"
            name="delivery_location"
            value={shipment.delivery_location}
            placeholder="Enter delivery location"
            onChange={handleChange}
          />


          {/* Status */}

          <div>

            <label className="block text-sm font-medium text-slate-300 mb-2">
              Shipment Status
            </label>

            <select
              name="current_status"
              value={shipment.current_status}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-700 text-white px-4 py-3 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
            >

              <option value="Assigned">
                Assigned
              </option>

              <option value="Picked Up">
                Picked Up
              </option>

              <option value="In Transit">
                In Transit
              </option>

              <option value="Out For Delivery">
                Out For Delivery
              </option>

              <option value="Delivered">
                Delivered
              </option>

              <option value="Delayed">
                Delayed
              </option>

              <option value="Cancelled">
                Cancelled
              </option>

            </select>

          </div>

        </div>


        {/* Buttons */}

        <div className="flex justify-end gap-4 mt-8">

          <button
            type="button"
            onClick={() => navigate("/shipments")}
            className="px-6 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            Cancel
          </button>


          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-900/30 transition disabled:opacity-50"
          >
            {saving ? "Adding..." : "Add Shipment"}
          </button>

        </div>

      </form>

    </Layout>
  );
}


/* ================= FORM FIELD ================= */

function FormField({
  label,
  name,
  type = "text",
  value,
  placeholder,
  onChange,
}) {
  return (
    <div>

      <label className="block text-sm font-medium text-slate-300 mb-2">
        {label}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        className="w-full bg-slate-950 border border-slate-700 text-white placeholder-slate-500 px-4 py-3 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
      />

    </div>
  );
}

export default AddShipment;