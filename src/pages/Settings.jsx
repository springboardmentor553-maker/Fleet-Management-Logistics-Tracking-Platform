import { useEffect, useState } from "react";
import api from "../services/api";
import "./Settings.css";

function Settings() {
  const [loading, setLoading] = useState(true);

  const [settings, setSettings] = useState({
    company_name: "",
    admin_email: "",
    phone: "",
    language: "English",
    dark_mode: false,
  });

  // ==========================
  // Load Settings
  // ==========================

  useEffect(() => {
    fetchSettings();

    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
      document.body.classList.add("dark-theme");
    } else {
      document.body.classList.remove("dark-theme");
    }
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get("/settings");

      setSettings(response.data);

      if (response.data.dark_mode) {
        document.body.classList.add("dark-theme");
        localStorage.setItem("theme", "dark");
      } else {
        document.body.classList.remove("dark-theme");
        localStorage.setItem("theme", "light");
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  // ==========================
  // Handle Changes
  // ==========================

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    const updatedSettings = {
      ...settings,
      [name]: type === "checkbox" ? checked : value,
    };

    setSettings(updatedSettings);

    if (name === "dark_mode") {
      if (checked) {
        document.body.classList.add("dark-theme");
        localStorage.setItem("theme", "dark");
      } else {
        document.body.classList.remove("dark-theme");
        localStorage.setItem("theme", "light");
      }
    }
  };

  // ==========================
  // Save
  // ==========================

  const saveSettings = async () => {
    try {
      await api.put("/settings", settings);

      localStorage.setItem(
        "theme",
        settings.dark_mode ? "dark" : "light"
      );

      alert("Settings Saved Successfully");
    } catch (error) {
      console.log(error);
      alert("Unable to save settings");
    }
  };

  // ==========================
  // Reset
  // ==========================

  const resetSettings = () => {
    fetchSettings();
  };

  if (loading) {
    return (
      <div className="settings-loading">
        Loading Settings...
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-card">

        <div className="settings-header">
          <h1>System Settings</h1>
          <p>Manage your FleetFlow application settings.</p>
        </div>

        <div className="setting-group">
          <label>Company Name</label>

          <input
            type="text"
            name="company_name"
            value={settings.company_name}
            onChange={handleChange}
          />
        </div>

        <div className="setting-group">
          <label>Admin Email</label>

          <input
            type="email"
            name="admin_email"
            value={settings.admin_email}
            onChange={handleChange}
          />
        </div>

        <div className="setting-group">
          <label>Phone Number</label>

          <input
            type="text"
            name="phone"
            value={settings.phone}
            onChange={handleChange}
          />
        </div>

        <div className="setting-group">
          <label>Language</label>

          <select
            name="language"
            value={settings.language}
            onChange={handleChange}
          >
            <option>English</option>
            <option>Hindi</option>
          </select>
        </div>

        <div className="setting-switch">

          <div>
            <h4>Dark Mode</h4>
            <small>Enable dark appearance.</small>
          </div>

          <label className="switch">

            <input
              type="checkbox"
              name="dark_mode"
              checked={settings.dark_mode}
              onChange={handleChange}
            />

            <span className="slider"></span>

          </label>

        </div>

        <div className="settings-buttons">

          <button
            className="save-btn"
            onClick={saveSettings}
          >
            Save Settings
          </button>

          <button
            className="reset-btn"
            onClick={resetSettings}
          >
            Reset
          </button>

        </div>

      </div>
    </div>
  );
}

export default Settings;