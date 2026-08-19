import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../services/api";

function EditTrip() {
  const { id } = useParams();
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

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTrip();
  }, [id]);

  const loadTrip = async () => {
    try {
      setLoading(true);

      const res = await api.get(`/trips/${id}`);

      setTrip({
        shipment_id: res.data.shipment_id || "",
        driver_id: res.data.driver_id || "",
        vehicle_id: res.data.vehicle_id || "",
        pickup_location: res.data.pickup_location || "",
        destination: res.data.destination || "",
        scheduled_start_time:
          res.data.scheduled_start_time || "",
        scheduled_end_time:
          res.data.scheduled_end_time || "",
        trip_status:
          res.data.trip_status || "Scheduled",
      });

    } catch (err) {
      console.log(err);

      alert(
        err.response?.data?.detail ||
          "Failed to load trip"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setTrip({
      ...trip,
      [e.target.name]: e.target.value,
    });
  };

  const updateTrip = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      await api.put(`/trips/${id}`, null, {
        params: {
          shipment_id: trip.shipment_id,
          driver_id: trip.driver_id,
          vehicle_id: trip.vehicle_id,
          pickup_location: trip.pickup_location,
          destination: trip.destination,
          scheduled_start_time:
            trip.scheduled_start_time,
          scheduled_end_time:
            trip.scheduled_end_time,
          trip_status: trip.trip_status,
        },
      });

      alert("Trip Updated Successfully");

      navigate("/trips");

    } catch (err) {
      console.log(err);

      alert(
        err.response?.data?.detail ||
          "Failed to Update Trip"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>

        <div className="flex justify-center items-center py-20">

          <div className="text-center">

            <div className="text-5xl mb-4">
              🚚
            </div>

            <p className="text-teal-300 text-lg font-semibold">
              Loading trip...
            </p>

          </div>

        </div>

      </Layout>
    );
  }

  return (
    <Layout>

      {/* ================= HEADER ================= */}

      <div className="mb-8">

        <p className="text-teal-300 text-sm font-medium mb-2">
          FleetFlow • Operations Center
        </p>

        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-teal-300 via-cyan-300 to-teal-400 bg-clip-text text-transparent">
          Edit Trip
        </h1>

        <p className="text-teal-100/70 mt-2">
          Update trip details and operational status
        </p>

      </div>


      {/* ================= FORM ================= */}

      <form
        onSubmit={updateTrip}
        className="bg-[#062126]/80 backdrop-blur-xl border border-teal-900/60 rounded-2xl shadow-2xl p-8"
      >

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Shipment ID */}

          <FormField
            label="Shipment ID"
            name="shipment_id"
            type="number"
            value={trip.shipment_id}
            placeholder="Enter shipment ID"
            onChange={handleChange}
          />


          {/* Driver ID */}

          <FormField
            label="Driver ID"
            name="driver_id"
            type="number"
            value={trip.driver_id}
            placeholder="Enter driver ID"
            onChange={handleChange}
          />


          {/* Vehicle ID */}

          <FormField
            label="Vehicle ID"
            name="vehicle_id"
            type="number"
            value={trip.vehicle_id}
            placeholder="Enter vehicle ID"
            onChange={handleChange}
          />


          {/* Pickup */}

          <FormField
            label="Pickup Location"
            name="pickup_location"
            value={trip.pickup_location}
            placeholder="Enter pickup location"
            onChange={handleChange}
          />


          {/* Destination */}

          <FormField
            label="Destination"
            name="destination"
            value={trip.destination}
            placeholder="Enter destination"
            onChange={handleChange}
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
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold hover:from-green-400 hover:to-emerald-400 shadow-lg shadow-green-900/30 transition disabled:opacity-50"
          >
            {saving
              ? "Updating..."
              : "Update Trip"}
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

      <label className="block text-sm font-medium text-teal-100/80 mb-2">
        {label}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        className="w-full bg-[#03181b] border border-teal-900/70 text-white placeholder-teal-100/30 px-4 py-3 rounded-xl outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 transition"
      />

    </div>
  );
}

export default EditTrip;