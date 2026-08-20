import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/authService";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const data = await login(email, password);

      localStorage.setItem("token", data.access_token);

      navigate("/dashboard");
    } catch (err) {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#071b2f]">

      {/* =====================================================
          LEFT SIDE - TRUCK BACKGROUND
      ===================================================== */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden text-white">

        {/* Truck Image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/fleet-trucks.jpg.png')",
          }}
        />

        {/* Professional dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#06182d]/75 via-[#082846]/70 to-[#031421]/95" />

        {/* Extra blue glow */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />

        <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-400/15 rounded-full blur-3xl" />

        {/* LEFT CONTENT */}
        <div className="relative z-10 flex flex-col justify-between w-full p-12 xl:p-16">

          {/* ================= LOGO ================= */}
          <div className="flex items-center gap-4">

            {/* FleetFlow Logo */}
            <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-600/40">

              <svg
                width="34"
                height="34"
                viewBox="0 0 64 64"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Truck */}
                <path
                  d="M8 18H40V42H8V18Z"
                  stroke="white"
                  strokeWidth="4"
                  strokeLinejoin="round"
                />

                <path
                  d="M40 27H49L56 35V42H40V27Z"
                  stroke="white"
                  strokeWidth="4"
                  strokeLinejoin="round"
                />

                {/* Wheels */}
                <circle
                  cx="19"
                  cy="45"
                  r="5"
                  stroke="white"
                  strokeWidth="4"
                />

                <circle
                  cx="47"
                  cy="45"
                  r="5"
                  stroke="white"
                  strokeWidth="4"
                />

                {/* Route */}
                <path
                  d="M12 12C22 5 34 8 39 14"
                  stroke="#38BDF8"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                <circle cx="12" cy="12" r="3" fill="#38BDF8" />
                <circle cx="39" cy="14" r="3" fill="#38BDF8" />
              </svg>

            </div>

            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                Fleet<span className="text-blue-400">Flow</span>
              </h1>

              <p className="text-xs tracking-[0.3em] text-blue-200 mt-1">
                FLEET INTELLIGENCE
              </p>
            </div>

          </div>


          {/* ================= HERO ================= */}
          <div className="max-w-2xl">

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md text-sm text-blue-100 mb-7">

              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />

              Operations Platform

            </div>


            <p className="uppercase tracking-[0.35em] text-xs text-blue-300 mb-4">
              Powering movement
            </p>


            <h2 className="text-5xl xl:text-6xl font-extrabold leading-tight">

              Move Smarter.
              <br />

              <span className="text-blue-400">
                Deliver Better.
              </span>

            </h2>


            <p className="mt-6 text-lg text-slate-100 leading-relaxed max-w-xl">

              Manage vehicles, drivers, shipments, routes and maintenance
              from one connected fleet operations platform.

            </p>


            {/* ================= FEATURES ================= */}
            <div className="grid grid-cols-4 gap-3 mt-10 max-w-xl">

              <Feature
                icon="📍"
                title="Real-time"
                subtitle="Tracking"
              />

              <Feature
                icon="🚚"
                title="Efficient"
                subtitle="Dispatch"
              />

              <Feature
                icon="🔧"
                title="Smart"
                subtitle="Maintenance"
              />

              <Feature
                icon="🛡"
                title="Safer"
                subtitle="Operations"
              />

            </div>

          </div>


          {/* ================= FOOTER ================= */}
          <div className="flex items-center gap-4 text-xs tracking-[0.3em] text-slate-300">

            <span>TRACK</span>

            <span className="text-blue-400">●</span>

            <span>MANAGE</span>

            <span className="text-blue-400">●</span>

            <span>DELIVER</span>

          </div>

        </div>

      </div>


      {/* =====================================================
          RIGHT SIDE - LOGIN
      ===================================================== */}
      <div className="w-full lg:w-[45%] bg-[#f7faff] flex items-center justify-center px-6 py-10">

        <div className="w-full max-w-lg">

          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">

            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">

              <svg
                width="28"
                height="28"
                viewBox="0 0 64 64"
                fill="none"
              >

                <path
                  d="M8 18H40V42H8V18Z"
                  stroke="white"
                  strokeWidth="4"
                />

                <path
                  d="M40 27H49L56 35V42H40V27Z"
                  stroke="white"
                  strokeWidth="4"
                />

                <circle
                  cx="19"
                  cy="45"
                  r="5"
                  stroke="white"
                  strokeWidth="4"
                />

                <circle
                  cx="47"
                  cy="45"
                  r="5"
                  stroke="white"
                  strokeWidth="4"
                />

              </svg>

            </div>

            <div>

              <h1 className="text-2xl font-bold text-slate-900">
                Fleet<span className="text-blue-600">Flow</span>
              </h1>

              <p className="text-[10px] tracking-[0.25em] text-slate-500">
                FLEET INTELLIGENCE
              </p>

            </div>

          </div>


          {/* ================= LOGIN CARD ================= */}
          <div className="bg-white rounded-3xl shadow-[0_25px_70px_rgba(15,23,42,0.12)] border border-slate-100 p-8 sm:p-10">

            {/* Secure Login */}
            <div className="flex justify-center mb-7">

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold">

                <span>🛡</span>

                Secure Login

              </div>

            </div>


            {/* Heading */}
            <div className="text-center mb-8">

              <h2 className="text-4xl font-extrabold text-slate-900">
                Welcome Back
              </h2>

              <p className="text-slate-500 mt-3">
                Sign in to access your FleetFlow workspace.
              </p>

            </div>


            {/* ================= FORM ================= */}
            <form onSubmit={handleLogin} className="space-y-6">

              {/* EMAIL */}
              <div>

                <label className="block text-sm font-semibold text-slate-800 mb-2">
                  Email Address
                </label>

                <div className="relative">

                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    ✉
                  </span>

                  <input
                    type="email"
                    placeholder="you@company.com"
                    className="w-full border border-slate-200 rounded-xl px-11 py-4 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />

                </div>

              </div>


              {/* PASSWORD */}
              <div>

                <div className="flex justify-between items-center mb-2">

                  <label className="text-sm font-semibold text-slate-800">
                    Password
                  </label>

                  <button
                    type="button"
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Forgot password?
                  </button>

                </div>

                <div className="relative">

                  <span className="absolute left-4 top-1/2 -translate-y-1/2">
                    🔒
                  </span>

                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="w-full border border-slate-200 rounded-xl px-11 pr-12 py-4 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showPassword ? "🙈" : "👁"}
                  </button>

                </div>

              </div>


              {/* REMEMBER ME */}
              <label className="flex items-center gap-3 text-sm text-slate-600 cursor-pointer">

                <input
                  type="checkbox"
                  className="w-4 h-4 accent-blue-600"
                />

                Remember me

              </label>


              {/* ERROR */}
              {error && (
                <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">

                  <span className="text-lg">⚠</span>

                  {error}

                </div>
              )}


              {/* LOGIN BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:opacity-60 text-white py-4 rounded-xl font-bold text-base shadow-lg shadow-blue-500/25 transition-all duration-200"
              >

                {loading ? "Signing in..." : "Sign In  →"}

              </button>

            </form>


            {/* DIVIDER */}
            <div className="flex items-center gap-4 my-8">

              <div className="flex-1 h-px bg-slate-200" />

              <span className="text-sm text-slate-400">
                or
              </span>

              <div className="flex-1 h-px bg-slate-200" />

            </div>


            {/* CREATE ACCOUNT */}
            <p className="text-center text-sm text-slate-500">

              New to FleetFlow?{" "}

              <button
                type="button"
                className="font-bold text-blue-600 hover:text-blue-700"
              >
                Create an account
              </button>

            </p>


            {/* SECURITY MESSAGE */}
            <div className="mt-8 rounded-xl bg-blue-50 px-4 py-3 text-center text-xs text-blue-700">

              🔒 Your data is secure and encrypted

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}


/* =====================================================
   FEATURE COMPONENT
===================================================== */

function Feature({ icon, title, subtitle }) {

  return (

    <div className="rounded-xl border border-white/15 bg-white/10 backdrop-blur-md p-4 text-center shadow-lg">

      <div className="text-2xl mb-2">
        {icon}
      </div>

      <p className="text-sm font-semibold text-white">
        {title}
      </p>

      <p className="text-xs text-blue-200">
        {subtitle}
      </p>

    </div>

  );

}


export default Login;