import { createContext, useContext, useState, useEffect } from "react";
import { parseJwt, getProfile } from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      if (token) {
        try {
          const decoded = parseJwt(token);
          if (decoded && decoded.exp * 1000 > Date.now()) {
            // Verify and fetch details from profile endpoint
            const profileData = await getProfile();
            setUser({
              email: profileData.user?.sub || decoded.sub,
              role: profileData.user?.role || decoded.role,
              name: profileData.user?.name || "User",
            });
          } else {
            logout();
          }
        } catch (error) {
          console.error("Initial auth verification failed:", error);
          logout();
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    initializeAuth();
  }, [token]);

  const login = (newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
