import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../services/api";

function EditDriver() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [driver, setDriver] = useState({
    name: "",
    phone: "",
    license_number: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadDriver();
  }, [id]);

  const loadDriver = async () => {
    try {
      setLoading(true);

      const res = await api.get(`/drivers/${id}`);

      setDriver({
        name: res.data.name || "",
        phone: res.data.phone || "",
        license_number: res.data.license_number || "",
      });

    } catch (err) {
      console.log(err);

      alert(
        err.response?.data?.detail ||
        "Failed to load driver"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setDriver({
      ...driver,
      [e.target.name]: e.target.value,
    });
  };

  const updateDriver = async (e) => {
    e.preventDefault();

    if (!driver.name || !driver.phone || !driver.license_number) {
      alert("Please fill all fields");
      return;
    }

    try {
      setSaving(true);

      await api.put(`/drivers/${id}`, null, {
        params: {
          name: driver.name,
          phone: driver.phone,
          license_number: driver.license_number,
        },
      });

      alert("Driver Updated Successfully");

      navigate("/drivers");

    } catch (err) {
      console.log(err);

      alert(
        err.response?.data?.detail ||
        "Failed to update driver"
      );

    } finally {
      setSaving(false);
    }
  };

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <Layout>

        <div className="flex justify-center items-center py-20">

          <div className="text-center">

            <div className="text-5xl mb-4">
              🧑‍✈️
            </div>

            <p className="text-teal-300 text-lg font-semibold">
              Loading driver...
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
          FleetFlow • People Center
        </p>

        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-teal-300 via-cyan-300 to-teal-400 bg-clip-text text-transparent">
          Edit Driver
        </h1>

        <p className="text-teal-100/70 mt-2">
          Update driver information
        </p>

      </div>


      {/* ================= FORM ================= */}

      <div className="max-w-3xl">

        <form
          onSubmit={updateDriver}
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
                onChange={handleChange}
                placeholder="Enter driver name"
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
                onChange={handleChange}
                placeholder="Enter phone number"
                className="w-full bg-[#03181b] border border-teal-900/60 text-teal-50 placeholder-teal-200/40 px-4 py-3 rounded-xl outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 transition"
              />

            </div>


            {/* License */}

            <div className="md:col-span-2">

              <label className="block text-sm font-medium text-teal-50/80 mb-2">
                License Number
              </label>

              <input
                type="text"
                name="license_number"
                value={driver.license_number}
                onChange={handleChange}
                placeholder="Enter license number"
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


            {/* Update Driver */}

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-400 to-cyan-400 text-[#03181b] font-semibold hover:from-teal-300 hover:to-cyan-300 shadow-lg shadow-teal-900/30 transition disabled:opacity-50"
            >
              {saving
                ? "Updating..."
                : "Update Driver"}
            </button>

          </div>

        </form>

      </div>

    </Layout>
  );
}

export default EditDriver;