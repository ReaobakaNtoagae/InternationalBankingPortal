import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Toast from "./Toast";
import styles from "./Register.module.css";

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    idNumber: "",
    accountNumber: "",
    password: "",
  });
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => setToast({ message, type });

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { fullName, idNumber, accountNumber, password } = formData;
    if (!fullName || !idNumber || !accountNumber || !password) {
      showToast("Please fill in all required fields.", "error");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.error || "Registration failed", "error");
        return;
      }

      showToast(data.message || "Registration successful!", "success");

      setFormData({ fullName: "", idNumber: "", accountNumber: "", password: "" });

      setTimeout(() => navigate("/login"), 1000);
    } catch (err) {
      console.error(err);
      showToast("Server error. Please try again later.", "error");
    }
  };

  return (
    <div className={styles.container}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <h2>Register</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <input name="fullName" placeholder="Full Name" value={formData.fullName} onChange={handleChange} required />
        <input name="idNumber" placeholder="ID Number" value={formData.idNumber} onChange={handleChange} required />
        <input name="accountNumber" placeholder="Account Number" value={formData.accountNumber} onChange={handleChange} required />
        <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
        <button type="submit">Register</button>
      </form>
      <p style={{ marginTop: "20px" }}>
        Already have an account?{" "}
        <Link to="/login" style={{ color: "#ffcb05", fontWeight: "600" }}>Login</Link>
      </p>
    </div>
  );
}
