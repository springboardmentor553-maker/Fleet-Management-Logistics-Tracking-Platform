import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Truck, Lock, Mail } from "lucide-react";
import api from "../api/axios";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.access_token);
      const meRes = await api.get("/auth/me");
      localStorage.setItem("user", JSON.stringify(meRes.data));
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed. Try again.");
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
        <h2 style={{ marginBottom: 4 }}>Welcome back</h2>
        <p style={{ fontSize: 13, marginBottom: 20 }}>Login to your account</p>

        {error && <div style={styles.errorBox}>{error}</div>}

        <div style={styles.inputGroup}>
          <Mail size={15} />
          <input type="email" placeholder="Email" value={email}
            onChange={(e) => setEmail(e.target.value)} style={styles.input} required />
        </div>

        <div style={styles.inputGroup}>
          <Lock size={15} />
          <input type="password" placeholder="Password" value={password}
            onChange={(e) => setPassword(e.target.value)} style={styles.input} required />
        </div>

        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? "Logging in..." : "Login"}
        </button>
        <p style={{ fontSize: 12.5, textAlign: "center", marginTop: 14 }}>
            Don't have an account? <Link to="/register" style={{ color: "var(--accent)" }}>Register</Link>
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
  inputGroup: { display: "flex", alignItems: "center", gap: 8, border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px", marginBottom: 12 },
  input: { border: "none", outline: "none", background: "transparent", width: "100%", fontSize: 14, color: "var(--text-h)" },
  button: { width: "100%", padding: "10px 0", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 4 },
};