import { useState } from "react";
import axios from "axios";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/auth/login",
        formData
      );

      alert("Login Successful!");
      console.log(res.data);
    } catch (err) {
      alert("Invalid Email or Password");
    }
  };

  return (
    <div style={{ padding: "40px" }}>
      <h2>FleetFlow Login</h2>

      <input
        type="email"
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />
      <br /><br />

      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />
      <br /><br />

      <button onClick={handleLogin}>Login</button>
    </div>
  );
}

export default Login;