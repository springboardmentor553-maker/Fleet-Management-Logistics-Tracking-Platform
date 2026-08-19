import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";

function Profile() {
  const navigate = useNavigate();

  const email = localStorage.getItem("email") || "User";
  const role = localStorage.getItem("role") || "User";

  return (
    <Layout>

      {/* HEADER */}

      <div className="mb-8">

        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-cyan-300 via-cyan-400 to-teal-300 bg-clip-text text-transparent">
          My Profile
        </h1>

        <p className="text-slate-400 mt-2">
          View your FleetFlow account information
        </p>

      </div>


      {/* PROFILE CARD */}

      <div className="max-w-3xl bg-slate-900/75 backdrop-blur-xl border border-cyan-500/20 rounded-2xl shadow-2xl p-8">

        {/* PROFILE HEADER */}

        <div className="flex items-center gap-5 pb-8 border-b border-slate-700">

          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-cyan-900/30">
            {email.charAt(0).toUpperCase()}
          </div>

          <div>

            <h2 className="text-2xl font-bold text-white">
              {role}
            </h2>

            <div className="flex items-center gap-2 mt-2">

              <span className="w-2.5 h-2.5 bg-green-400 rounded-full"></span>

              <span className="text-green-400 text-sm">
                Online
              </span>

            </div>

          </div>

        </div>


        {/* ACCOUNT DETAILS */}

        <div className="mt-8 space-y-5">

          <div>

            <p className="text-sm text-slate-500">
              Email
            </p>

            <p className="text-white text-lg mt-1">
              {email}
            </p>

          </div>


          <div>

            <p className="text-sm text-slate-500">
              Role
            </p>

            <p className="text-cyan-400 text-lg font-semibold mt-1">
              {role}
            </p>

          </div>


          <div>

            <p className="text-sm text-slate-500">
              Account Status
            </p>

            <span className="inline-block mt-2 px-4 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
              Active
            </span>

          </div>

        </div>
        {/* BACK BUTTON */}

        <div className="mt-8 pt-6 border-t border-slate-700">

          <button
            onClick={() => navigate("/dashboard")}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-semibold hover:from-cyan-400 hover:to-teal-400 shadow-lg shadow-cyan-900/20 transition"
          >
            ← Back to Dashboard
          </button>

        </div>

      </div>

    </Layout>
  );
}

export default Profile;