import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./components/Login";
import CustomerPortal from "./components/CustomerPortal";
import EmployeePortal from "./components/EmployeePortal";
import Transactions from "./components/Transactions";


function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    
    if (!token || token === "null" || token === "undefined") {
      console.warn("⚠️ No valid token found. User not authenticated.");
      setLoading(false);
      return;
    }

    console.log("🔐 Token found in localStorage:", token);

    
    fetch("http://localhost:5000/api/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        console.log("📡 /api/auth/me response status:", res.status);
        const data = await res.json();
        console.log("📦 /api/auth/me response data:", data);

        if (res.ok && data.user) {
          console.log(
            "✅ Authenticated user:",
            data.user.fullName,
            "| Role:",
            data.user.role
          );
          setUser(data.user);
        } else {
          console.warn("❌ Invalid token or no user found in response.");
          localStorage.removeItem("token"); // ✅ clear bad token
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ Error fetching user:", err);
        localStorage.removeItem("token");
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
        {/* Default route */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* Public routes */}
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/transactions" element={<Transactions />} />
    

        {/* Protected: Customer Portal */}
        <Route
          path="/customer-portal"
          element={
            user && user.role === "customer" ? (
              <CustomerPortal user={user} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Protected: Employee Portal */}
        <Route
          path="/employee-portal"
          element={
            user && user.role === "employee" ? (
              <EmployeePortal user={user} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
