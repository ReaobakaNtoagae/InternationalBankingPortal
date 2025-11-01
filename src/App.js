import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./components/Login";
import Home from "./components/Home";
import CustomerPortal from "./components/CustomerPortal";
import BeneficiaryPayment from "./components/BeneficiaryPayment";
import EmployeePortal from "./components/EmployeePortal";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // ✅ Prevent premature routing

  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log("🔐 Token found in localStorage:", token);

    if (!token) {
      console.warn("⚠️ No token found. User not authenticated.");
      setLoading(false);
      return;
    }

    fetch("http://localhost:5000/api/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        console.log("📡 /api/auth/me response status:", res.status);
        return res.json();
      })
      .then((data) => {
        console.log("📦 /api/auth/me response data:", data);
        if (data.user) {
          console.log("✅ Authenticated user:", data.user.fullName, "| Role:", data.user.role);
          setUser(data.user);
        } else {
          console.warn("❌ No user found in response.");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ Error fetching user:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    console.log("⏳ Waiting for user authentication...");
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/home" element={<Home />} />
        <Route path="/beneficiary" element={<BeneficiaryPayment />} />

        {/* ✅ Customer Portal — protected */}
        <Route
          path="/customer-portal"
          element={
            user?.role === "customer" ? (
              <CustomerPortal user={user} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* ✅ Employee Portal — protected */}
        <Route
          path="/employee-portal"
          element={
            user?.role === "employee" ? (
              <EmployeePortal user={user} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* ✅ Catch-all fallback */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
