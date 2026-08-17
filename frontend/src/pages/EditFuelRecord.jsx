import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../services/api";

function EditFuelRecord() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [fuel, setFuel] = useState({
    vehicle_id: "",
    driver_id: "",
    fuel_quantity: "",
    fuel_cost: "",
    odometer_reading: "",
    fuel_date: "",
    fuel_station: "",
    remarks: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ================= LOAD RECORD =================

  useEffect(() => {
    loadFuel();
  }, [id]);

  const loadFuel = async () => {
    try {
      setLoading(true);

      const response = await api.get(
        `/fuel-records/${id}`
      );

      const data = response.data;

      setFuel({
        vehicle_id: data.vehicle_id ?? "",
        driver_id: data.driver_id ?? "",
        fuel_quantity: data.fuel_quantity ?? "",
        fuel_cost: data.fuel_cost ?? "",
        odometer_reading: data.odometer_reading ?? "",
        fuel_date: data.fuel_date
          ? data.fuel_date.substring(0, 10)
          : "",
        fuel_station: data.fuel_station ?? "",
        remarks: data.remarks ?? "",
      });

    } catch (error) {
      console.log("Load Fuel Error:", error);

      alert(
        error.response?.data?.detail ||
          "Failed to load fuel record"
      );

      navigate("/fuel-records");
    } finally {
      setLoading(false);
    }
  };

  // ================= HANDLE CHANGE =================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFuel((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ================= UPDATE =================

  const updateFuel = async (e) => {
    e.preventDefault();

    // Basic validation
    if (
      !fuel.vehicle_id ||
      !fuel.driver_id ||
      !fuel.fuel_quantity ||
      !fuel.fuel_cost ||
      !fuel.odometer_reading ||
      !fuel.fuel_date ||
      !fuel.fuel_station
    ) {
      alert("Please fill all required fields");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        vehicle_id: Number(fuel.vehicle_id),
        driver_id: Number(fuel.driver_id),
        fuel_quantity: Number(fuel.fuel_quantity),
        fuel_cost: Number(fuel.fuel_cost),
        odometer_reading: Number(
          fuel.odometer_reading
        ),
        fuel_date: fuel.fuel_date,
        fuel_station: fuel.fuel_station,
        remarks: fuel.remarks || "",
      };

      console.log("Updating fuel:", payload);

      await api.put(
        `/fuel-records/${id}`,
        payload
      );

      alert("Fuel Record Updated Successfully");

      navigate("/fuel-records");

    } catch (error) {
      console.log(
        "Update Fuel Error:",
        error.response?.data || error
      );

      const detail =
        error.response?.data?.detail;

      if (Array.isArray(detail)) {
        alert(
          detail
            .map((item) => item.msg)
            .join("\n")
        );
      } else {
        alert(
          detail ||
            "Failed to update fuel record"
        );
      }

    } finally {
      setSaving(false);
    }
  };

  // ================= LOADING =================

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center py-20">
          <p className="text-blue-400 text-lg">
            Loading fuel record...
          </p>
        </div>
      </Layout>
    );
  }

  // ================= PAGE =================

  return (
    <Layout>

      {/* HEADER */}

      <div className="mb-8">

        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">
          Edit Fuel Record
        </h1>

        <p className="text-slate-400 mt-2">
          Update fuel consumption and operational details
        </p>

      </div>


      {/* FORM */}

      <form
        onSubmit={updateFuel}
        className="bg-slate-900/75 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-2xl p-8"
      >

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* VEHICLE */}

          <FormField
            label="Vehicle ID"
            name="vehicle_id"
            type="number"
            value={fuel.vehicle_id}
            placeholder="Enter vehicle ID"
            onChange={handleChange}
            required
          />


          {/* DRIVER */}

          <FormField
            label="Driver ID"
            name="driver_id"
            type="number"
            value={fuel.driver_id}
            placeholder="Enter driver ID"
            onChange={handleChange}
            required
          />


          {/* QUANTITY */}

          <FormField
            label="Fuel Quantity (Litres)"
            name="fuel_quantity"
            type="number"
            step="0.01"
            min="0"
            value={fuel.fuel_quantity}
            placeholder="Enter fuel quantity"
            onChange={handleChange}
            required
          />


          {/* COST */}

          <FormField
            label="Fuel Cost (₹)"
            name="fuel_cost"
            type="number"
            step="0.01"
            min="0"
            value={fuel.fuel_cost}
            placeholder="Enter fuel cost"
            onChange={handleChange}
            required
          />


          {/* ODOMETER */}

          <FormField
            label="Odometer Reading"
            name="odometer_reading"
            type="number"
            step="0.01"
            min="0"
            value={fuel.odometer_reading}
            placeholder="Enter odometer reading"
            onChange={handleChange}
            required
          />


          {/* DATE */}

          <div>

            <label className="block text-sm font-medium text-slate-300 mb-2">
              Fuel Date
            </label>

            <input
              type="date"
              name="fuel_date"
              value={fuel.fuel_date}
              onChange={handleChange}
              required
              className="w-full bg-slate-950 border border-slate-700 text-white px-4 py-3 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
            />

          </div>


          {/* FUEL STATION */}

          <FormField
            label="Fuel Station"
            name="fuel_station"
            type="text"
            value={fuel.fuel_station}
            placeholder="Enter fuel station"
            onChange={handleChange}
            required
          />


          {/* REMARKS */}

          <div className="md:col-span-2">

            <label className="block text-sm font-medium text-slate-300 mb-2">
              Remarks
            </label>

            <textarea
              name="remarks"
              value={fuel.remarks}
              onChange={handleChange}
              placeholder="Enter remarks"
              rows="4"
              className="w-full bg-slate-950 border border-slate-700 text-white placeholder-slate-500 px-4 py-3 rounded-xl outline-none resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
            />

          </div>

        </div>


        {/* BUTTONS */}

        <div className="flex justify-end gap-4 mt-8">

          <button
            type="button"
            onClick={() =>
              navigate("/fuel-records")
            }
            className="px-6 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            Cancel
          </button>


          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold hover:from-green-500 hover:to-emerald-500 shadow-lg shadow-green-900/20 transition disabled:opacity-50"
          >
            {saving
              ? "Updating..."
              : "Update Fuel Record"}
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
  step,
  min,
  value,
  placeholder,
  onChange,
  required = false,
}) {
  return (
    <div>

      <label className="block text-sm font-medium text-slate-300 mb-2">
        {label}
      </label>

      <input
        type={type}
        name={name}
        step={step}
        min={min}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        required={required}
        className="w-full bg-slate-950 border border-slate-700 text-white placeholder-slate-500 px-4 py-3 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
      />

    </div>
  );
}

export default EditFuelRecord;