import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../services/api";

function AddDriver() {
  const navigate = useNavigate();

  const [driver, setDriver] = useState({
    name: "",
    phone: "",
    license_number: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setDriver({
      ...driver,
      [e.target.name]: e.target.value,
    });
  };

  const saveDriver = async (e) => {
    e.preventDefault();

    // Validation
    if (!driver.name || !driver.phone || !driver.license_number) {
      alert("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);

      // Send data as JSON body
      const response = await api.post("/drivers/", {
        name: driver.name,
        phone: driver.phone,
        license_number: driver.license_number,
      });

      console.log("Driver created:", response.data);

      alert("Driver Added Successfully");

      navigate("/drivers");
    } catch (err) {
      console.error("Driver creation error:", err);
      console.error("Backend response:", err.response?.data);

      const detail = err.response?.data?.detail;

      if (Array.isArray(detail)) {
        alert(detail.map((item) => item.msg).join("\n"));
      } else if (typeof detail === "string") {
        alert(detail);
      } else if (err.response?.data?.message) {
        alert(err.response.data.message);
      } else {
        alert("Failed to add driver");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>

      {/* ================= HEADER ================= */}

      <div className="mb-8">

        <p className="text-teal-300 text-sm font-medium mb-2">
          FleetFlow • People Center
        </p>

        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-teal-300 via-cyan-300 to-teal-400 bg-clip-text text-transparent">
          Add Driver
        </h1>

        <p className="text-teal-100/70 mt-2">
          Register a new driver in your fleet
        </p>

      </div>


      {/* ================= FORM ================= */}

      <div className="max-w-3xl">

        <form
          onSubmit={saveDriver}
          className="bg-[#062126]/80 backdrop-blur-xl border border-teal-900/60 rounded-2xl shadow-2xl p-8"
        >

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Driver Name */}

            <div>

              <label className="block text-sm font-medium text-teal-50/80 mb-2">
                Driver Name
              </label>

              <input
                type="text"
                name="name"
                value={driver.name}
                placeholder="Enter driver name"
                onChange={handleChange}
                className="w-full bg-[#03181b] border border-teal-900/60 text-teal-50 placeholder-teal-200/40 px-4 py-3 rounded-xl outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 transition"
              />

            </div>


            {/* Phone */}

            <div>

              <label className="block text-sm font-medium text-teal-50/80 mb-2">
                Phone Number
              </label>

              <input
                type="tel"
                name="phone"
                value={driver.phone}
                placeholder="Enter phone number"
                onChange={handleChange}
                className="w-full bg-[#03181b] border border-teal-900/60 text-teal-50 placeholder-teal-200/40 px-4 py-3 rounded-xl outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 transition"
              />

            </div>


            {/* License Number */}

            <div className="md:col-span-2">

              <label className="block text-sm font-medium text-teal-50/80 mb-2">
                License Number
              </label>

              <input
                type="text"
                name="license_number"
                value={driver.license_number}
                placeholder="Enter license number"
                onChange={handleChange}
                className="w-full bg-[#03181b] border border-teal-900/60 text-teal-50 placeholder-teal-200/40 px-4 py-3 rounded-xl outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 transition"
              />

            </div>

          </div>


          {/* ================= BUTTONS ================= */}

          <div className="flex justify-end gap-4 mt-8">

            {/* Cancel */}

            <button
              type="button"
              onClick={() => navigate("/drivers")}
              className="px-6 py-3 rounded-xl border border-teal-900/60 text-teal-100/70 hover:bg-[#0a2b30] hover:text-teal-50 transition"
            >
              Cancel
            </button>


            {/* Save Driver */}

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-400 to-cyan-400 text-[#03181b] font-semibold hover:from-teal-300 hover:to-cyan-300 shadow-lg shadow-teal-900/30 transition disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Driver"}
            </button>

          </div>

        </form>

      </div>

    </Layout>
  );
}

export default AddDriver;