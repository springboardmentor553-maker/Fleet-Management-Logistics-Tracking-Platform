import { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { loginUser, logoutUser } from "../services/authService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(null);

  useEffect(() => {

    const savedToken = localStorage.getItem("token");

    if (savedToken) {

      try {

        const decoded = jwtDecode(savedToken);

        setUser(decoded);

      } catch {

        localStorage.removeItem("token");

      }

    }

  }, []);

  const login = async (email, password) => {

    const data = await loginUser(email, password);

    const decoded = jwtDecode(data.access_token);

    setToken(data.access_token);

    setUser(decoded);

    return data;

  };

  const logout = () => {

    logoutUser();

    setToken(null);

    setUser(null);

  };

  return (

    <AuthContext.Provider
      value={{
        token,
        user,
        login,
        logout,
        isAuthenticated: !!token
      }}
    >

      {children}

    </AuthContext.Provider>

  );

};

export const useAuth = () => useContext(AuthContext);