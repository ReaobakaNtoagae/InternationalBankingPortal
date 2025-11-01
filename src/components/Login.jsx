import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Toast from "./Toast";
import styles from "./Login.module.css";

export default function Login({ setUser }) {
  const navigate = useNavigate();
  const [loginData, setLoginData] = useState({
    fullName: "",
    accountNumber: "",
    password: "",
  });
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  const showToast = (message, type = "success") => {
    console.log(`🔔 Toast: ${type} - ${message}`);
    setToast({ message, type });
  };

  const handleChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  // Check if token exists and fetch user info
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const fetchUser = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/auth/me", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          localStorage.removeItem("token");
          console.warn("⛔ Token invalid or expired, please login again.");
          return;
        }

        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          const role = data.user.role;
          if (role === "employee") navigate("/employee-portal");
          else if (role === "customer") navigate("/customer-portal");
        }
      } catch (err) {
        console.error("❌ Fetch user error:", err);
      }
    };

    fetchUser();
  }, [navigate, setUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { fullName, accountNumber, password } = loginData;

    if (!fullName.trim() || !accountNumber.trim() || !password.trim()) {
      showToast("Please fill in all required fields.", "error");
      return;
    }

    setLoading(true);
    console.log("📨 Submitting login form with:", loginData);

    try {
      localStorage.removeItem("token"); // only remove token

      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          accountNumber: accountNumber.trim(),
          password: password.trim(),
        }),
      });

      console.log("📡 Login response status:", response.status);
      const data = await response.json();
      console.log("📦 Login response data:", data);

      if (!response.ok || !data.token || !data.user) {
        showToast(data.error || "Login failed", "error");
        return;
      }

      // Save token
      localStorage.setItem("token", data.token);
      console.log("🔐 Token saved to localStorage");

      setUser(data.user);
      showToast(`Welcome back, ${data.user.fullName}!`, "success");

      // Redirect based on role
      setTimeout(() => {
        const role = data.user.role;
        if (role === "employee") navigate("/employee-portal");
        else if (role === "customer") navigate("/customer-portal");
        else {
          console.warn("⛔ Unknown role:", role);
          showToast("Unknown user role. Please contact support.", "error");
          navigate("/login");
        }
      }, 500);
    } catch (err) {
      console.error("❌ Login error:", err);
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
    </div>
  );
}
