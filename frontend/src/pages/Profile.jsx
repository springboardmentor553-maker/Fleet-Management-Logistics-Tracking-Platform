import { useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";

function Profile() {
  const { user } = useAuth();
  const [profileInfo, setProfileInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setErrorMsg("");
      try {
        const res = await api.get("/profile");
        // Response format: { message: "Protected Route", user: { id, name, email, role } }
        setProfileInfo(res.data.user);
      } catch (err) {
        console.error("Failed to load user profile", err);
        setErrorMsg("Unable to retrieve account details from the server.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="page-container profile-page">
      <div className="page-header">
        <div>
          <h2>My Profile</h2>
          <p className="page-subtitle">Personal account information and security privileges</p>
        </div>
      </div>

      {errorMsg && (
        <div className="error-banner">
          <span>⚠</span> {errorMsg}
        </div>
      )}

      {profileInfo && (
        <div className="profile-details-card">
          <div className="profile-badge-section">
            <span className="profile-icon">👤</span>
            <h3>{profileInfo.name}</h3>
            <span className="user-role-badge badge-role-large">{profileInfo.role}</span>
          </div>

          <div className="profile-info-grid">
            <div className="info-row">
              <span className="info-label">User ID:</span>
              <span className="info-val">#{profileInfo.id || "N/A"}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Registered Name:</span>
              <span className="info-val">{profileInfo.name}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Email Address:</span>
              <span className="info-val">{profileInfo.email || (profileInfo.sub)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Security Role:</span>
              <span className="info-val">
                <code>{profileInfo.role}</code>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
