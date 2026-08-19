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

      localStorage.setItem(
        "token",
        response.data.access_token
      );

      if (response.data.role) {
        localStorage.setItem(
          "role",
          response.data.role
        );
      }

      if (response.data.email) {
        localStorage.setItem(
          "email",
          response.data.email
        );
      } else {
        localStorage.setItem(
          "email",
          username
        );
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
    <div className="min-h-screen bg-[#071512] text-white flex items-center justify-center px-5 py-10">

      {/* MAIN CONTAINER */}

      <div className="w-full max-w-md">

        {/* LOGO */}

        <div className="text-center mb-8">

          <div className="flex items-center justify-center gap-3">

            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-2xl shadow-lg shadow-teal-900/30">
              🚛
            </div>

            <h1 className="text-4xl font-extrabold text-white">
              FleetFlow
            </h1>

          </div>

          <p className="text-teal-300 mt-2 text-sm font-medium">
            Fleet Management Platform
          </p>

        </div>


        {/* SMALL CAPTION */}

        <p className="text-center text-[#8eaaa3] text-sm mb-7">
          Manage your fleets and logistics with ease.
        </p>


        {/* LOGIN CARD */}

        <div className="bg-[#10231f] border border-[#29463f] rounded-2xl p-7 md:p-8 shadow-2xl">

          {/* HEADING */}

          <div className="text-center mb-7">

            <h2 className="text-2xl font-bold text-white">
              Welcome Back
            </h2>

            <p className="text-[#8eaaa3] mt-2 text-sm">
              Sign in to continue to FleetFlow
            </p>

          </div>


          {/* LOGIN FORM */}

          <form onSubmit={handleLogin}>

            {/* EMAIL */}

            <div className="mb-5">

              <label className="block text-sm font-medium text-[#c5d7d2] mb-2">
                Email
              </label>

              <input
                type="email"
                placeholder="Enter your email"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value)
                }
                className="w-full bg-[#081714] border border-[#34534b] text-white placeholder-[#607b73] rounded-xl px-4 py-3.5 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 transition"
                required
              />

            </div>


            {/* PASSWORD */}

            <div className="mb-6">

              <label className="block text-sm font-medium text-[#c5d7d2] mb-2">
                Password
              </label>

              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                className="w-full bg-[#081714] border border-[#34534b] text-white placeholder-[#607b73] rounded-xl px-4 py-3.5 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 transition"
                required
              />

            </div>


            {/* SIGN IN */}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-teal-900/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "Signing In..."
                : "Sign In"}
            </button>

          </form>


          {/* REGISTER */}

          <div className="mt-6 text-center">

            <p className="text-[#8eaaa3] text-sm">

              Don't have an account?{" "}

              <Link
                to="/register"
                className="text-teal-300 font-semibold hover:text-teal-200 transition"
              >
                Register
              </Link>

            </p>

          </div>

        </div>


        {/* FOOTER */}

        <p className="text-center text-[#526c65] text-xs mt-6">
          FleetFlow • Fleet Management & Logistics
        </p>

      </div>

    </div>
  );
}

export default Login;