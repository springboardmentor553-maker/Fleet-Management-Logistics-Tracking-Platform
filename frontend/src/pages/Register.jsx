import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Truck, Lock, Mail, User } from "lucide-react";
import api from "../api/axios";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "driver",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/register", form);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <form onSubmit={handleSubmit} style={styles.card}>
        <div style={styles.logoRow}>
          <div style={styles.logoIcon}><Truck size={18} color="#fff" /></div>
          <span style={styles.logoText}>FleetFlow</span>
        </div>
        <h2 style={{ marginBottom: 4 }}>Create account</h2>
        <p style={{ fontSize: 13, marginBottom: 20 }}>Register to get started</p>

        {error && <div style={styles.errorBox}>{error}</div>}
        {success && <div style={styles.successBox}>Account created! Redirecting to login...</div>}

        <div style={styles.inputGroup}>
          <User size={15} />
          <input name="name" type="text" placeholder="Full Name" value={form.name}
            onChange={handleChange} style={styles.input} required />
        </div>

        <div style={styles.inputGroup}>
          <Mail size={15} />
          <input name="email" type="email" placeholder="Email" value={form.email}
            onChange={handleChange} style={styles.input} required />
        </div>

        <div style={styles.inputGroup}>
          <Lock size={15} />
          <input name="password" type="password" placeholder="Password" value={form.password}
            onChange={handleChange} style={styles.input} required />
        </div>

        <select name="role" value={form.role} onChange={handleChange} style={styles.select}>
          <option value="driver">Driver</option>
          <option value="dispatcher">Dispatcher</option>
          <option value="fleet_manager">Fleet Manager</option>
          <option value="admin">Admin</option>
        </select>

        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? "Creating account..." : "Register"}
        </button>

        <p style={{ fontSize: 12.5, textAlign: "center", marginTop: 14 }}>
          Already have an account? <Link to="/login" style={{ color: "var(--accent)" }}>Login</Link>
        </p>
      </form>
    </div>
  );
}

const styles = {
  wrapper: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" },
  card: { width: 340, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, padding: 28, boxShadow: "var(--shadow)" },
  logoRow: { display: "flex", alignItems: "center", gap: 8, marginBottom: 20 },
  logoIcon: { width: 30, height: 30, borderRadius: 8, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" },
  logoText: { fontWeight: 600, fontSize: 16, color: "var(--text-h)" },
  errorBox: { background: "#fee2e2", color: "#dc2626", fontSize: 13, padding: "8px 10px", borderRadius: 6, marginBottom: 14 },
  successBox: { background: "#dcfce7", color: "#16a34a", fontSize: 13, padding: "8px 10px", borderRadius: 6, marginBottom: 14 },
  inputGroup: { display: "flex", alignItems: "center", gap: 8, border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px", marginBottom: 12 },
  input: { border: "none", outline: "none", background: "transparent", width: "100%", fontSize: 14, color: "var(--text-h)" },
  select: { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text-h)", fontSize: 14, marginBottom: 12, outline: "none" },
  button: { width: "100%", padding: "10px 0", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" },
};