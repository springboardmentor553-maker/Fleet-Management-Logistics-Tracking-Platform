import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Truck, Lock, Mail } from "lucide-react";
import api from "../api/axios";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
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
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.banner}>LOGIN PAGE</div>

        <div style={styles.body}>
          {/* Left: form */}
          <div style={styles.formSide}>
            <div style={styles.logoRow}>
              <div style={styles.logoIcon}><Truck size={20} color="#fff" /></div>
              <div>
                <div style={styles.logoText}>FleetFlow</div>
                <div style={styles.logoSub}>Fleet Management Platform</div>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              {error && <div style={styles.errorBox}>{error}</div>}

              <label style={styles.label}>Email</label>
              <div style={styles.inputGroup}>
                <Mail size={15} style={{ color: "#9ca3af" }} />
                <input
                  type="email"
                  placeholder="admin@fleetflow.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>

              <label style={styles.label}>Password</label>
              <div style={styles.inputGroup}>
                <Lock size={15} style={{ color: "#9ca3af" }} />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.rowBetween}>
                <label style={styles.rememberLabel}>
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    style={{ marginRight: 6 }}
                  />
                  Remember me
                </label>
                <Link to="/forgot-password" style={styles.link}>Forgot Password?</Link>
              </div>

              <button type="submit" disabled={loading} style={styles.button}>
                {loading ? "Logging in..." : "Login"}
              </button>

              <p style={styles.registerText}>
                Don't have an account? <Link to="/register" style={styles.link}>Register here</Link>
              </p>
            </form>
          </div>

          {/* Right: illustration panel */}
          <div style={styles.imageSide}>
            <div style={styles.imageOverlay} />
            <svg viewBox="0 0 400 260" style={styles.truckSvg}>
              <rect x="0" y="190" width="400" height="70" fill="#2d2d3a" />
              <rect x="0" y="185" width="400" height="6" fill="#f4d35e" opacity="0.6" />
              <rect x="40" y="130" width="140" height="60" rx="4" fill="#e5e7eb" />
              <rect x="180" y="150" width="70" height="40" rx="4" fill="#c084fc" />
              <rect x="190" y="158" width="30" height="22" rx="2" fill="#dbeafe" />
              <circle cx="90" cy="195" r="18" fill="#1f2937" />
              <circle cx="90" cy="195" r="7" fill="#9ca3af" />
              <circle cx="220" cy="195" r="18" fill="#1f2937" />
              <circle cx="220" cy="195" r="7" fill="#9ca3af" />
              <circle cx="330" cy="80" r="36" fill="#fcd34d" opacity="0.8" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f3f4f6",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 760,
    borderRadius: 16,
    overflow: "hidden",
    boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
    background: "#fff",
  },
  banner: {
    background: "linear-gradient(90deg, #2563eb, #7c3aed)",
    color: "#fff",
    textAlign: "center",
    padding: "10px 0",
    fontWeight: 700,
    fontSize: 13,
    letterSpacing: 1,
  },
  body: {
    display: "flex",
    flexWrap: "wrap",
  },
  formSide: {
    flex: "1 1 340px",
    padding: "32px 36px",
  },
  logoRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 26 },
  logoIcon: {
    width: 38, height: 38, borderRadius: 10, background: "#2563eb",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  logoText: { fontWeight: 700, fontSize: 17, color: "#111827" },
  logoSub: { fontSize: 11, color: "#6b7280" },
  errorBox: { background: "#fee2e2", color: "#dc2626", fontSize: 13, padding: "8px 10px", borderRadius: 6, marginBottom: 14 },
  label: { fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5, display: "block" },
  inputGroup: {
    display: "flex", alignItems: "center", gap: 8,
    border: "1px solid #e5e7eb", borderRadius: 8,
    padding: "10px 12px", marginBottom: 16, background: "#fafafa",
  },
  input: { border: "none", outline: "none", background: "transparent", width: "100%", fontSize: 14, color: "#111827" },
  rowBetween: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  rememberLabel: { fontSize: 12.5, color: "#4b5563", display: "flex", alignItems: "center" },
  link: { color: "#2563eb", fontSize: 12.5, textDecoration: "none", fontWeight: 500 },
  button: {
    width: "100%", padding: "11px 0", background: "linear-gradient(90deg, #2563eb, #7c3aed)",
    color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer",
  },
  registerText: { fontSize: 12.5, textAlign: "center", marginTop: 16, color: "#6b7280" },
  imageSide: {
    flex: "1 1 260px",
    position: "relative",
    background: "linear-gradient(180deg, #fbbf6a 0%, #f97794 40%, #6b46c1 100%)",
    minHeight: 260,
  },
  imageOverlay: {
    position: "absolute", inset: 0,
    background: "rgba(0,0,0,0.05)",
  },
  truckSvg: { width: "100%", height: "100%" },
};