import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Toast from "./Toast";
import styles from "./Login.module.css";

export default function Login() {
  const navigate = useNavigate();
  const [loginData, setLoginData] = useState({
    fullName: "",
    accountNumber: "",
    password: "",
  });
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  // Toast helper
  const showToast = (message, type = "success") => setToast({ message, type });

  // Input handler
  const handleChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  // Login submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    const { fullName, accountNumber, password } = loginData;

    if (!fullName.trim() || !accountNumber.trim() || !password.trim()) {
      showToast("Please fill in all required fields.", "error");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          accountNumber: accountNumber.trim(),
          password: password.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.error || "Login failed", "error");
        return;
      }

      // ✅ Store user details with correct ID key (_id)
      localStorage.setItem("token", data.token);
      localStorage.setItem(
        "loggedInUser",
        JSON.stringify({
          _id: data.user.id, // 👈 important change (CustomerPortal expects _id)
          fullName: data.user.fullName,
          accountNumber: data.user.accountNumber,
        })
      );

      showToast(`Welcome back, ${data.user.fullName}!`, "success");

     
      setTimeout(() => navigate("/customer-portal"), 1000);
    } catch (err) {
      console.error("Login error:", err);
      showToast("Server error. Please try again later.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <h2 className={styles.title}>Login</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          type="text"
          name="fullName"
          placeholder="Full Name"
          value={loginData.fullName}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="accountNumber"
          placeholder="Account Number"
          value={loginData.accountNumber}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={loginData.password}
          onChange={handleChange}
          required
        />
        <button type="submit" className={styles.button} disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <p style={{ marginTop: "20px" }}>
        Don’t have an account yet?{" "}
        <Link to="/" style={{ color: "#ffcb05", fontWeight: "600" }}>
          Register
        </Link>
      </p>
    </div>
  );
}
