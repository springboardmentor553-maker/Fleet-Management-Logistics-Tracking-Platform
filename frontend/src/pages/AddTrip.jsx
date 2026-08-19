import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../services/api";

function AddTrip() {
  const navigate = useNavigate();

  const [trip, setTrip] = useState({
    shipment_id: "",
    driver_id: "",
    vehicle_id: "",
    pickup_location: "",
    destination: "",
    scheduled_start_time: "",
    scheduled_end_time: "",
    trip_status: "Scheduled",
  });

  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    setTrip({
      ...trip,
      [e.target.name]: e.target.value,
    });
  };

  const saveTrip = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      await api.post("/trips", null, {
        params: {
          shipment_id: trip.shipment_id,
          driver_id: trip.driver_id,
          vehicle_id: trip.vehicle_id,
          pickup_location: trip.pickup_location,
          destination: trip.destination,
          scheduled_start_time: trip.scheduled_start_time,
          scheduled_end_time: trip.scheduled_end_time,
          trip_status: trip.trip_status,
        },
      });

      alert("Trip Created Successfully");

      navigate("/trips");
    } catch (err) {
      console.log(err);

      if (err.response) {
        alert(
          err.response.data.detail ||
            err.response.data.message ||
            "Failed to Create Trip"
        );
      } else {
        alert("Failed to Create Trip");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>

      {/* ================= HEADER ================= */}

      <div className="mb-8">

        <p className="text-teal-300 text-sm font-medium mb-2">
          FleetFlow • Operations Center
        </p>

        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-teal-300 via-cyan-300 to-teal-400 bg-clip-text text-transparent">
          Add Trip
        </h1>

        <p className="text-teal-100/70 mt-2">
          Create and schedule a new fleet trip
        </p>

      </div>


      {/* ================= FORM ================= */}

      <form
        onSubmit={saveTrip}
        className="bg-[#062126]/80 backdrop-blur-xl border border-teal-900/60 rounded-2xl shadow-2xl p-8"
      >

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Shipment ID */}

          <FormField
            label="Shipment ID"
            name="shipment_id"
            type="number"
            placeholder="Enter shipment ID"
            value={trip.shipment_id}
            onChange={handleChange}
            required
          />


          {/* Driver ID */}

          <FormField
            label="Driver ID"
            name="driver_id"
            type="number"
            placeholder="Enter driver ID"
            value={trip.driver_id}
            onChange={handleChange}
            required
          />


          {/* Vehicle ID */}

          <FormField
            label="Vehicle ID"
            name="vehicle_id"
            type="number"
            placeholder="Enter vehicle ID"
            value={trip.vehicle_id}
            onChange={handleChange}
            required
          />


          {/* Pickup */}

          <FormField
            label="Pickup Location"
            name="pickup_location"
            placeholder="Enter pickup location"
            value={trip.pickup_location}
            onChange={handleChange}
            required
          />


          {/* Destination */}

          <FormField
            label="Destination"
            name="destination"
            placeholder="Enter destination"
            value={trip.destination}
            onChange={handleChange}
            required
          />


          {/* Start Time */}

          <div>

            <label className="block text-sm font-medium text-teal-100/80 mb-2">
              Start Time
            </label>

            <input
              type="datetime-local"
              name="scheduled_start_time"
              value={trip.scheduled_start_time}
              onChange={handleChange}
              required
              className="w-full bg-[#03181b] border border-teal-900/70 text-white px-4 py-3 rounded-xl outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 transition"
            />

          </div>


          {/* End Time */}

          <div>

            <label className="block text-sm font-medium text-teal-100/80 mb-2">
              End Time
            </label>

            <input
              type="datetime-local"
              name="scheduled_end_time"
              value={trip.scheduled_end_time}
              onChange={handleChange}
              required
              className="w-full bg-[#03181b] border border-teal-900/70 text-white px-4 py-3 rounded-xl outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 transition"
            />

          </div>


          {/* Trip Status */}

          <div>

            <label className="block text-sm font-medium text-teal-100/80 mb-2">
              Trip Status
            </label>

            <select
              name="trip_status"
              value={trip.trip_status}
              onChange={handleChange}
              className="w-full bg-[#03181b] border border-teal-900/70 text-white px-4 py-3 rounded-xl outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 transition"
            >

              <option value="Scheduled">
                Scheduled
              </option>

              <option value="Active">
                Active
              </option>

              <option value="Completed">
                Completed
              </option>

              <option value="Cancelled">
                Cancelled
              </option>

            </select>

          </div>

        </div>


        {/* ================= BUTTONS ================= */}

        <div className="flex justify-end gap-4 mt-8">

          <button
            type="button"
            onClick={() => navigate("/trips")}
            className="px-6 py-3 rounded-xl border border-teal-900/70 text-teal-100/80 hover:bg-teal-900/40 hover:text-white transition"
          >
            Cancel
          </button>


          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-400 to-cyan-400 text-[#03181b] font-semibold hover:from-teal-300 hover:to-cyan-300 shadow-lg shadow-teal-900/30 transition disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create Trip"}
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
  placeholder,
  value,
  onChange,
  required = false,
}) {
  return (
    <div>

      <label className="block text-sm font-medium text-teal-100/80 mb-2">
        {label}
      </label>

      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full bg-[#03181b] border border-teal-900/70 text-white placeholder-teal-100/30 px-4 py-3 rounded-xl outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 transition"
      />

    </div>
  );
}

export default AddTrip;