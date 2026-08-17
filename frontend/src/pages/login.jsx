import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const formData = new URLSearchParams();

      formData.append("username", username);
      formData.append("password", password);

      const response = await api.post(
        "/auth/login",
        formData,
        {
          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",
          },
        }
      );

      // Save JWT token
      localStorage.setItem(
        "token",
        response.data.access_token
      );

      // Save role
      if (response.data.role) {
        localStorage.setItem(
          "role",
          response.data.role
        );
      }

      // Save email
      if (response.data.email) {
        localStorage.setItem(
          "email",
          response.data.email
        );
      } else {
        localStorage.setItem("email", username);
      }

      alert("Login Successful");

      navigate("/dashboard");

    } catch (error) {

      console.log(error);

      alert(
        error.response?.data?.detail ||
        "Invalid Username or Password"
      );

    } finally {
      setLoading(false);
    }
  };

  return (

    <div className="min-h-screen bg-slate-950 text-white flex overflow-hidden">

      {/* ================= LEFT SIDE ================= */}

      <div className="hidden md:flex md:w-1/2 relative overflow-hidden">

        {/* Background glow */}

        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"></div>

        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl"></div>


        <div className="relative z-10 w-full flex flex-col justify-center px-16">

          {/* Logo */}

          <div className="mb-10">

            <div className="flex items-center gap-4">

              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-4xl shadow-lg shadow-blue-900/40">
                🚚
              </div>

              <div>

                <h1 className="text-5xl font-extrabold bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">
                  FleetFlow
                </h1>

                <p className="text-slate-500 mt-1">
                  Fleet Management Platform
                </p>

              </div>

            </div>

          </div>


          {/* Main text */}

          <h2 className="text-4xl font-bold leading-tight mb-6">

            Manage your fleet.
            <br />

            <span className="text-blue-400">
              Move smarter.
            </span>

          </h2>


          <p className="text-slate-400 text-lg leading-relaxed max-w-lg">

            A complete fleet management and logistics
            tracking platform for vehicles, drivers,
            shipments, fuel and maintenance operations.

          </p>


          {/* Features */}

          <div className="grid grid-cols-2 gap-4 mt-10 max-w-lg">

            <Feature
              icon="🚛"
              text="Fleet Monitoring"
            />

            <Feature
              icon="📦"
              text="Shipment Tracking"
            />

            <Feature
              icon="⛽"
              text="Fuel Monitoring"
            />

            <Feature
              icon="📊"
              text="Operational Reports"
            />

          </div>

        </div>

      </div>


      {/* ================= RIGHT SIDE ================= */}

      <div className="w-full md:w-1/2 flex items-center justify-center px-6 py-10 relative">

        {/* Background glow */}

        <div className="absolute top-20 right-10 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl"></div>


        {/* Login Card */}

        <div className="relative z-10 w-full max-w-md">

          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/60 rounded-3xl p-8 md:p-10 shadow-2xl shadow-black/40">


            {/* Mobile Logo */}

            <div className="md:hidden text-center mb-8">

              <div className="text-5xl mb-3">
                🚚
              </div>

              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                FleetFlow
              </h1>

            </div>


            {/* Heading */}

            <div className="mb-8">

              <h2 className="text-3xl font-bold text-white">
                Welcome Back
              </h2>

              <p className="text-slate-400 mt-2">
                Sign in to continue to FleetFlow
              </p>

            </div>


            {/* Login Form */}

            <form onSubmit={handleLogin}>

              {/* Email */}

              <div className="mb-5">

                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Email
                </label>

                <div className="relative">

                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">
                    📧
                  </span>

                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={username}
                    onChange={(e) =>
                      setUsername(e.target.value)
                    }
                    className="w-full bg-slate-950 border border-slate-700 text-white placeholder-slate-600 rounded-xl px-12 py-3.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                    required
                  />

                </div>

              </div>


              {/* Password */}

              <div className="mb-7">

                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Password
                </label>

                <div className="relative">

                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">
                    🔒
                  </span>

                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    className="w-full bg-slate-950 border border-slate-700 text-white placeholder-slate-600 rounded-xl px-12 py-3.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                    required
                  />

                </div>

              </div>


              {/* Login Button */}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-blue-900/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >

                {loading
                  ? "Signing In..."
                  : "Sign In"}

              </button>

            </form>


            {/* ================= REGISTER LINK ================= */}

            <div className="mt-6 text-center">

              <p className="text-slate-400 text-sm">

                Don't have an account?{" "}

                <Link
                  to="/register"
                  className="text-blue-400 font-semibold hover:text-blue-300 transition"
                >
                  Register
                </Link>

              </p>

            </div>


            {/* Footer */}

            <div className="mt-6 pt-6 border-t border-slate-800 text-center">

              <p className="text-xs text-slate-600">
                FleetFlow • Fleet Management & Logistics
                Tracking Platform
              </p>

            </div>

          </div>

        </div>

      </div>

    </div>

  );
}


/* ================= FEATURE ================= */

function Feature({ icon, text }) {

  return (

    <div className="flex items-center gap-3 bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3">

      <span className="text-xl">
        {icon}
      </span>

      <span className="text-sm text-slate-400">
        {text}
      </span>

    </div>

  );
}

export default Login;