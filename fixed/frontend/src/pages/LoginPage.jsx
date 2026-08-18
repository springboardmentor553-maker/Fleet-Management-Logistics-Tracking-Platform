import React, { useState } from "react";
import { authApi } from "../api/fleetApi.js";
import { formatErrorMessage } from "../api/client.js";

export function LoginPage({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "manager",
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        // Step 1: Register new account
        await authApi.register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        });

        // Step 2: Auto login after registration
        const loginRes = await authApi.login({
          email: formData.email,
          password: formData.password,
        });

        onLoginSuccess(loginRes);
      } else {
        // Direct Login
        const loginRes = await authApi.login({
          email: formData.email,
          password: formData.password,
        });

        onLoginSuccess(loginRes);
      }
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-container" style={styles.container}>
      <div className="login-card" style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logo}>🚚</div>
          <h1 style={styles.title}>FleetFlow</h1>
          <p style={styles.subtitle}>Logistics & Fleet Management Platform</p>
        </div>

        {/* Tab Toggle */}
        <div style={styles.tabGroup}>
          <button
            type="button"
            style={{
              ...styles.tabBtn,
              ...( !isRegister ? styles.activeTab : {} ),
            }}
            onClick={() => {
              setIsRegister(false);
              setError(null);
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            style={{
              ...styles.tabBtn,
              ...( isRegister ? styles.activeTab : {} ),
            }}
            onClick={() => {
              setIsRegister(true);
              setError(null);
            }}
          >
            Register
          </button>
        </div>

        {error && <div style={styles.errorBanner}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          {isRegister && (
            <div style={styles.field}>
              <label style={styles.label}>Full Name</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Sarah Jenkins"
                style={styles.input}
              />
            </div>
          )}

          <div style={styles.field}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="manager@fleetflow.com"
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              style={styles.input}
            />
          </div>

          {isRegister && (
            <div style={styles.field}>
              <label style={styles.label}>User Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                style={styles.input}
              >
                <option value="manager">Fleet Manager</option>
                <option value="dispatcher">Dispatcher</option>
                <option value="driver">Driver</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.submitBtn,
              ...(loading ? styles.disabledBtn : {}),
            }}
          >
            {loading
              ? "Authenticating..."
              : isRegister
              ? "Create Account & Sign In"
              : "Sign In to Dashboard"}
          </button>
        </form>

        <div style={styles.footerHint}>
          <p>Protected by FleetFlow JWT Security</p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0f172a",
    padding: "1.5rem",
    fontFamily: "'Inter', sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: "420px",
    backgroundColor: "#1e293b",
    borderRadius: "14px",
    padding: "2rem",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
  },
  header: {
    textAlign: "center",
    marginBottom: "1.75rem",
  },
  logo: {
    fontSize: "2.5rem",
    marginBottom: "0.25rem",
  },
  title: {
    fontSize: "1.75rem",
    fontWeight: "700",
    color: "#ffffff",
    margin: 0,
  },
  subtitle: {
    fontSize: "0.85rem",
    color: "#94a3b8",
    marginTop: "0.25rem",
  },
  tabGroup: {
    display: "flex",
    backgroundColor: "#0f172a",
    borderRadius: "8px",
    padding: "4px",
    marginBottom: "1.5rem",
  },
  tabBtn: {
    flex: 1,
    padding: "0.5rem",
    fontSize: "0.875rem",
    fontWeight: "600",
    color: "#94a3b8",
    background: "transparent",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  activeTab: {
    backgroundColor: "#0284c7",
    color: "#ffffff",
  },
  errorBanner: {
    backgroundColor: "rgba(220, 38, 38, 0.15)",
    border: "1px solid #dc2626",
    color: "#fca5a5",
    padding: "0.75rem",
    borderRadius: "6px",
    fontSize: "0.85rem",
    marginBottom: "1.25rem",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.1rem",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "0.35rem",
  },
  label: {
    fontSize: "0.8rem",
    fontWeight: "600",
    color: "#cbd5e1",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  input: {
    width: "100%",
    padding: "0.65rem 0.85rem",
    fontSize: "0.95rem",
    backgroundColor: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "8px",
    color: "#f8fafc",
    outline: "none",
  },
  submitBtn: {
    marginTop: "0.5rem",
    padding: "0.75rem",
    fontSize: "0.95rem",
    fontWeight: "600",
    color: "#ffffff",
    backgroundColor: "#0284c7",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "background 0.2s ease",
  },
  disabledBtn: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
  footerHint: {
    textAlign: "center",
    marginTop: "1.5rem",
    fontSize: "0.75rem",
    color: "#64748b",
  },
};
