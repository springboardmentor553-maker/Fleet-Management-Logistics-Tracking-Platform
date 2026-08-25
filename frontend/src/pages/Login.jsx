import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Lock, Mail, Truck } from "lucide-react";
import api from "../api/axios";
import { saveAuth } from "../utils/authStorage";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      const meRes = await api.get("/auth/me");
      saveAuth(res.data.access_token, meRes.data, remember);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="ff-auth-page">
      <section className="ff-auth-card">
        <div className="ff-auth-form-panel">
          <div className="ff-auth-brand">
            <div className="ff-auth-brand-icon"><Truck size={20} /></div>
            <div><strong>FleetFlow</strong><span>Operations workspace</span></div>
          </div>

          <div className="ff-auth-heading">
            <div className="ff-eyebrow">Welcome back</div>
            <h1>Keep your fleet moving.</h1>
            <p>Sign in to monitor vehicles, deliveries, drivers, and service schedules from one place.</p>
          </div>

          <form onSubmit={handleSubmit} className="ff-auth-form">
            {error && <div className="ff-modal-error" role="alert">{error}</div>}
            <label htmlFor="login-email">Work email</label>
            <div className="ff-auth-input">
              <Mail size={17} />
              <input id="login-email" type="email" placeholder="you@company.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </div>
            <div className="ff-auth-label-row">
              <label htmlFor="login-password">Password</label>
              <Link to="/forgot-password">Forgot password?</Link>
            </div>
            <div className="ff-auth-input">
              <Lock size={17} />
              <input id="login-password" type="password" placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            </div>
            <label className="ff-auth-check">
              <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
              <span>Keep me signed in on this device</span>
            </label>
            <button className="ff-auth-submit" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
              {!loading && <ArrowRight size={17} />}
            </button>
          </form>
          <p className="ff-auth-register">New to FleetFlow? <Link to="/register">Create an account</Link></p>
        </div>

        <div className="ff-auth-visual">
          <div className="ff-auth-visual-grid" />
          <div className="ff-auth-visual-copy">
            <span className="ff-auth-live"><i /> Live operations</span>
            <h2>Clarity across every mile.</h2>
            <p>Bring your fleet, shipments, and people into one calm operational view.</p>
            <div className="ff-auth-proof-list">
              <span><CheckCircle2 size={16} /> Real-time vehicle tracking</span>
              <span><CheckCircle2 size={16} /> Delivery and maintenance insights</span>
              <span><CheckCircle2 size={16} /> Role-aware team workflows</span>
            </div>
          </div>
          <div className="ff-auth-route-art" aria-hidden="true">
            <div className="ff-auth-route-line" />
            <div className="ff-auth-route-node node-one" />
            <div className="ff-auth-route-node node-two" />
            <div className="ff-auth-truck"><Truck size={22} /></div>
          </div>
        </div>
      </section>
    </main>
  );
}
