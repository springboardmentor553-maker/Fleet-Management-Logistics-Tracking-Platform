import { useState } from "react";
import {
  FaBell,
  FaCheckCircle,
  FaChevronRight,
  FaCog,
  FaEnvelope,
  FaLock,
  FaMoon,
  FaSignOutAlt,
  FaUserCircle,
  FaInfoCircle,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

function Settings() {
  const navigate = useNavigate();

  const [notifications, setNotifications] =
    useState(
      localStorage.getItem("notifications") !== "false"
    );

  const [emailNotifications, setEmailNotifications] =
    useState(
      localStorage.getItem("emailNotifications") !== "false"
    );

  const [compactMode, setCompactMode] =
    useState(
      localStorage.getItem("compactMode") === "true"
    );

  const updatePreference = (
    key,
    value,
    setter
  ) => {
    setter(value);
    localStorage.setItem(key, String(value));
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="min-h-full bg-slate-950 text-slate-100">

      {/* ================= HEADER ================= */}

      <div className="mb-8">

        <div className="flex items-center gap-3 mb-2">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
            <FaCog />
          </div>

          <span className="text-sm font-medium uppercase tracking-wider text-blue-400">
            System Preferences
          </span>

        </div>

        <h1 className="text-3xl font-bold tracking-tight text-white">
          Settings
        </h1>

        <p className="mt-2 text-slate-400">
          Manage your FleetFlow account and application preferences.
        </p>

      </div>


      {/* ================= SETTINGS GRID ================= */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* ================= LEFT / MAIN ================= */}

        <div className="space-y-6 xl:col-span-2">

          {/* ACCOUNT */}

          <SettingsCard
            title="Account"
            description="Manage your FleetFlow account information."
          >

            <div className="flex items-center gap-4">

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
                <FaUserCircle size={30} />
              </div>

              <div className="flex-1">

                <h3 className="font-semibold text-white">
                  FleetFlow Account
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Your account is protected by secure
                  authentication.
                </p>

              </div>

              <div className="hidden sm:block">

                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400">

                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

                  Active

                </span>

              </div>

            </div>

          </SettingsCard>


          {/* PREFERENCES */}

          <SettingsCard
            title="Preferences"
            description="Customize how FleetFlow behaves for you."
          >

            <div className="divide-y divide-slate-800">

              <SettingRow
                icon={<FaBell />}
                title="Notifications"
                description="Receive important fleet and operational alerts."
                enabled={notifications}
                onToggle={() =>
                  updatePreference(
                    "notifications",
                    !notifications,
                    setNotifications
                  )
                }
              />

              <SettingRow
                icon={<FaEnvelope />}
                title="Email Notifications"
                description="Receive important updates through email."
                enabled={emailNotifications}
                onToggle={() =>
                  updatePreference(
                    "emailNotifications",
                    !emailNotifications,
                    setEmailNotifications
                  )
                }
              />

              <SettingRow
                icon={<FaMoon />}
                title="Compact Interface"
                description="Use a more compact layout for data-heavy screens."
                enabled={compactMode}
                onToggle={() =>
                  updatePreference(
                    "compactMode",
                    !compactMode,
                    setCompactMode
                  )
                }
              />

            </div>

          </SettingsCard>


          {/* SECURITY */}

          <SettingsCard
            title="Security"
            description="Manage your account security."
          >

            <button
              type="button"
              className="flex w-full items-center gap-4 rounded-xl p-3 text-left transition hover:bg-slate-800/60"
            >

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                <FaLock />
              </div>

              <div className="flex-1">

                <p className="font-medium text-slate-200">
                  Change Password
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Update your account password to keep
                  your account secure.
                </p>

              </div>

              <FaChevronRight
                className="text-slate-600"
                size={13}
              />

            </button>

          </SettingsCard>

        </div>


        {/* ================= RIGHT ================= */}

        <div className="space-y-6">

          {/* PLATFORM STATUS */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <div className="mb-5 flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <FaCheckCircle />
              </div>

              <div>

                <h2 className="font-semibold text-white">
                  Platform Status
                </h2>

                <p className="text-xs text-slate-500">
                  FleetFlow system
                </p>

              </div>

            </div>


            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">

              <div className="flex items-center gap-3">

                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]" />

                <span className="text-sm font-semibold text-emerald-400">
                  All Systems Operational
                </span>

              </div>

              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                FleetFlow services are currently available.
              </p>

            </div>

          </div>


          {/* SYSTEM INFORMATION */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <div className="mb-5 flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <FaInfoCircle />
              </div>

              <div>

                <h2 className="font-semibold text-white">
                  System Information
                </h2>

                <p className="text-xs text-slate-500">
                  Application details
                </p>

              </div>

            </div>


            <div className="space-y-4">

              <InfoRow
                label="Application"
                value="FleetFlow"
              />

              <InfoRow
                label="Version"
                value="1.0.0"
              />

              <InfoRow
                label="Platform"
                value="Fleet Intelligence"
              />

            </div>

          </div>


          {/* LOGOUT */}

          <div className="rounded-2xl border border-red-500/10 bg-slate-900 p-6">

            <div className="mb-4">

              <h2 className="font-semibold text-white">
                Session
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Sign out of your FleetFlow account.
              </p>

            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-500/10"
            >
              <FaSignOutAlt size={14} />
              Log Out
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}


/* =====================================================
   SETTINGS CARD
===================================================== */

function SettingsCard({
  title,
  description,
  children,
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">

      <div className="border-b border-slate-800 px-6 py-5">

        <h2 className="font-semibold text-white">
          {title}
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          {description}
        </p>

      </div>

      <div className="p-5">
        {children}
      </div>

    </section>
  );
}


/* =====================================================
   SETTING ROW
===================================================== */

function SettingRow({
  icon,
  title,
  description,
  enabled,
  onToggle,
}) {
  return (
    <div className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-slate-400">
        {icon}
      </div>

      <div className="min-w-0 flex-1">

        <p className="font-medium text-slate-200">
          {title}
        </p>

        <p className="mt-1 text-sm text-slate-500">
          {description}
        </p>

      </div>

      <button
        type="button"
        onClick={onToggle}
        aria-label={`Toggle ${title}`}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          enabled
            ? "bg-blue-600"
            : "bg-slate-700"
        }`}
      >

        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${
            enabled
              ? "left-6"
              : "left-1"
          }`}
        />

      </button>

    </div>
  );
}


/* =====================================================
   INFO ROW
===================================================== */

function InfoRow({
  label,
  value,
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-800 pb-3 last:border-0 last:pb-0">

      <span className="text-sm text-slate-500">
        {label}
      </span>

      <span className="text-sm font-medium text-slate-300">
        {value}
      </span>

    </div>
  );
}


export default Settings;