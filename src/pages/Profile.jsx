import "./Profile.css";
import { useEffect, useState } from "react";
import { FaUserCircle, FaSignOutAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Profile() {
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    role: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get("/auth/profile");
      setProfile(response.data);
    } catch (error) {
      console.log(error);
      alert("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  };

  const saveProfile = async () => {
    try {
      const response = await api.put("/auth/profile", {
        name: profile.name,
        email: profile.email,
        role: profile.role,
      });

      setProfile(response.data);

      // Update local storage if your navbar uses it
      localStorage.setItem("user", JSON.stringify(response.data));

      setEditing(false);

      alert("Profile updated successfully!");
    } catch (error) {
      console.log(error);
      alert("Failed to update profile.");
    }
  };

  const handleLogout = () => {
    const confirmLogout = window.confirm(
      "Are you sure you want to logout?"
    );

    if (!confirmLogout) return;

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/", { replace: true });
  };

  if (loading) {
    return <div className="profile-loading">Loading Profile...</div>;
  }

  return (
    <div className="profile-page">
      <div className="profile-card">

        <FaUserCircle className="profile-avatar" />

        <h2>{profile.name}</h2>

        <p>{profile.role}</p>

        <div className="profile-info">

          <div className="info-row">
            <label>Full Name</label>

            {editing ? (
              <input
                type="text"
                name="name"
                value={profile.name}
                onChange={handleChange}
              />
            ) : (
              <span>{profile.name}</span>
            )}
          </div>

          <div className="info-row">
            <label>Email</label>

            {editing ? (
              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={handleChange}
              />
            ) : (
              <span>{profile.email}</span>
            )}
          </div>

          <div className="info-row">
            <label>Role</label>

            {editing ? (
              <input
                type="text"
                name="role"
                value={profile.role}
                onChange={handleChange}
              />
            ) : (
              <span>{profile.role}</span>
            )}
          </div>

        </div>

        {!editing ? (
          <button onClick={() => setEditing(true)}>
            Edit Profile
          </button>
        ) : (
          <div className="profile-buttons">

            <button onClick={saveProfile}>
              Save Changes
            </button>

            <button
              className="cancel-btn"
              onClick={() => {
                setEditing(false);
                fetchProfile();
              }}
            >
              Cancel
            </button>

          </div>
        )}

        <div
          className="profile-item logout"
          onClick={handleLogout}
          style={{
            width: "220px",
            height: "52px",
            margin: "20px auto 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            borderRadius: "50px",
            background: "linear-gradient(135deg,#ff9ea5,#ff6b6b)",
            color: "#fff",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer",
            boxShadow: "0 8px 20px rgba(255,107,107,.25)",
            transition: "all .3s ease",
          }}
        >
          <FaSignOutAlt />
          <span>Logout</span>
        </div>

      </div>
    </div>
  );
}

export default Profile;