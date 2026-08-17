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

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center py-20">
          <p className="text-blue-400 text-lg">
            Loading driver...
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>

      {/* Header */}

      <div className="mb-8">

        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">
          Edit Driver
        </h1>

        <p className="text-slate-400 mt-2">
          Update driver information
        </p>

      </div>


      {/* Form */}

      <div className="max-w-3xl">

        <form
          onSubmit={updateDriver}
          className="bg-slate-900/75 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-2xl p-8"
        >

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Driver Name */}

            <div>

              <label className="block text-sm font-medium text-slate-300 mb-2">
                Driver Name
              </label>

              <input
                type="text"
                name="name"
                value={driver.name}
                onChange={handleChange}
                placeholder="Enter driver name"
                className="w-full bg-slate-950 border border-slate-700 text-white placeholder-slate-500 px-4 py-3 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
              />

            </div>


            {/* Phone */}

            <div>

              <label className="block text-sm font-medium text-slate-300 mb-2">
                Phone Number
              </label>

              <input
                type="tel"
                name="phone"
                value={driver.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
                className="w-full bg-slate-950 border border-slate-700 text-white placeholder-slate-500 px-4 py-3 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
              />

            </div>


            {/* License */}

            <div className="md:col-span-2">

              <label className="block text-sm font-medium text-slate-300 mb-2">
                License Number
              </label>

              <input
                type="text"
                name="license_number"
                value={driver.license_number}
                onChange={handleChange}
                placeholder="Enter license number"
                className="w-full bg-slate-950 border border-slate-700 text-white placeholder-slate-500 px-4 py-3 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
              />

            </div>

          </div>


          {/* Buttons */}

          <div className="flex justify-end gap-4 mt-8">

            <button
              type="button"
              onClick={() => navigate("/drivers")}
              className="px-6 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold hover:from-green-500 hover:to-emerald-500 shadow-lg shadow-green-900/20 transition disabled:opacity-50"
            >
              {saving ? "Updating..." : "Update Driver"}
            </button>

          </div>

        </form>

      </div>

    </Layout>
  );
}

export default EditDriver;