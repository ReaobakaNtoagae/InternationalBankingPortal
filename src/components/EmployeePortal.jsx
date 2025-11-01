import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./EmployeePortal.module.css";

export default function EmployeePortal({ user }) {
  const navigate = useNavigate();
  console.log("✅ EmployeePortal rendered");

  const [token] = useState(localStorage.getItem("token"));
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🔐 Role-based protection
  useEffect(() => {
    if (!user || user.role !== "employee") {
      console.warn("⛔ Access denied: Not an employee");
      navigate("/login");
    }
  }, [user, navigate]);

  // 📡 Fetch pending payments
  useEffect(() => {
    if (!token) {
      setError("No token found. Please log in again.");
      setLoading(false);
      return;
    }

    const endpoint = "http://localhost:5000/api/payments/pending";
    console.log("📡 Fetching from:", endpoint);

    fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        console.log("📡 Pending payments response status:", res.status);
        if (!res.ok) throw new Error("Failed to fetch pending payments");
        return res.json();
      })
      .then((data) => {
        console.log("📦 Pending payments data:", data);
        setPendingPayments(data.payments || []);
      })
      .catch((err) => {
        console.error("❌ Error fetching pending payments:", err);
        setError("Unable to load pending payments.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (!user || user.role !== "employee") return null;

  return (
    <div className={styles.container}>
      <h1>Welcome to the Employee International Payments Portal</h1>
      <p>You can manage and approve international payments here.</p>

      <button onClick={handleLogout} className={styles.logout}>
        Logout
      </button>

      {loading && <p>Loading pending payments...</p>}
      {error && <p className={styles.error}>{error}</p>}

      {!loading && !error && pendingPayments.length === 0 && (
        <p>No pending payments found.</p>
      )}

      {!loading && !error && pendingPayments.length > 0 && (
        <div className={styles.paymentList}>
          {pendingPayments.map((payment) => (
            <div key={payment._id} className={styles.paymentCard}>
              <p><strong>Amount:</strong> {payment.amount} {payment.currency}</p>
              <p><strong>Provider:</strong> {payment.provider}</p>
              <p><strong>Status:</strong> {payment.status}</p>
              <p><strong>Created:</strong> {new Date(payment.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
