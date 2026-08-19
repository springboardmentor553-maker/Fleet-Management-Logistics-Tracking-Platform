import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "Administrator",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (
      !formData.name ||
      !formData.email ||
      !formData.password ||
      !formData.role
    ) {
      setError("Please fill all fields");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post(
        "/auth/register",
        null,
        {
          params: {
            name: formData.name,
            email: formData.email,
            password: formData.password,
            role: formData.role,
          },
        }
      );

      alert(
        response.data?.message ||
          "Registration successful"
      );

      navigate("/");
    } catch (err) {
      console.error(
        "Registration error:",
        err
      );

      setError(
        err.response?.data?.detail ||
          "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 flex items-center justify-center px-4 py-8">

      <div className="w-full max-w-md">

        {/* ================= LOGO ================= */}

        <div className="text-center mb-8">

          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-teal-400 via-cyan-400 to-emerald-400 flex items-center justify-center text-3xl shadow-lg shadow-teal-500/30 ring-1 ring-teal-300/30">
            🚛
          </div>

          <h1 className="mt-4 text-4xl font-extrabold bg-gradient-to-r from-teal-300 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
            FleetFlow
          </h1>

          <p className="text-slate-400 mt-2">
            Create your Fleet Management account
          </p>

        </div>


        {/* ================= CARD ================= */}

        <div className="bg-slate-900/90 backdrop-blur-xl border border-teal-400/30 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-teal-950/40">

          <h2 className="text-2xl font-bold text-white mb-6">
            Create Account
          </h2>


          {/* ================= ERROR ================= */}

          {error && (
            <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300">
              {error}
            </div>
          )}


          {/* ================= FORM ================= */}

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {/* NAME */}

            <div>

              <label className="block text-sm font-medium text-slate-300 mb-2">
                Name
              </label>

              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your name"
                className="w-full rounded-xl border border-teal-500/30 bg-slate-950 px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 transition"
              />

            </div>


            {/* EMAIL */}

            <div>

              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email
              </label>

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className="w-full rounded-xl border border-teal-500/30 bg-slate-950 px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 transition"
              />

            </div>


            {/* PASSWORD */}

            <div>

              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>

              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className="w-full rounded-xl border border-teal-500/30 bg-slate-950 px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 transition"
              />

            </div>


            {/* ROLE */}

            <div>

              <label className="block text-sm font-medium text-slate-300 mb-2">
                Role
              </label>

              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full rounded-xl border border-teal-500/30 bg-slate-950 px-4 py-3 text-white outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 transition"
              >

                <option value="Administrator">
                  Administrator
                </option>

                <option value="Fleet Manager">
                  Fleet Manager
                </option>

                <option value="Dispatcher">
                  Dispatcher
                </option>

                <option value="Driver">
                  Driver
                </option>

              </select>

            </div>
            {/* ================= REGISTER BUTTON ================= */}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-500 px-4 py-3 font-semibold text-white shadow-lg shadow-teal-900/40 transition hover:from-teal-400 hover:via-cyan-400 hover:to-emerald-400 hover:shadow-teal-500/30 disabled:opacity-60"
            >

              {loading
                ? "Creating Account..."
                : "Create Account"}

            </button>

          </form>


          {/* ================= LOGIN LINK ================= */}

          <p className="text-center text-slate-400 mt-6">

            Already have an account?{" "}

            <Link
              to="/"
              className="font-semibold text-teal-400 hover:text-cyan-300 transition"
            >
              Login
            </Link>

          </p>

        </div>

      </div>

    </div>
  );
}

export default Register;