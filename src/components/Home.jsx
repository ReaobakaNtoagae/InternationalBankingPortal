import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Toast from "./Toast";
import styles from "./Home.module.css";

export default function Home({ user }) {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    if (!user) return; // Wait for user to load

    const fetchPayments = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/payments/history", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();

        if (!res.ok) {
          showToast(data.error || "Failed to fetch payment history", "error");
          return;
        }

        setPayments(data.payments || []);
      } catch (error) {
        console.error("Error fetching history:", error);
        showToast("Server error. Try again later.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [user, navigate, token]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleNewPayment = () => navigate("/customer-portal");

  if (!user) return null;

  return (
    <div className={styles.container}>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <h2>Welcome back, {user.fullName}</h2>
      <p>
        Account Number: <strong>{user.accountNumber}</strong>
      </p>

      <div className={styles.actions}>
        <button onClick={handleNewPayment} className={styles.button}>
          New Payment / Transfer
        </button>

        <button onClick={handleLogout} className={styles.logout}>
          Logout
        </button>
      </div>

      <h3>Payment History</h3>

      {loading ? (
        <p>Loading payment history...</p>
      ) : payments.length === 0 ? (
        <p>No payments yet. Make your first transfer!</p>
      ) : (
        <div className={styles.historyBox}>
          {payments.map((p) => (
            <div key={p._id} className={styles.paymentCard}>
              <p>
                <strong>Amount:</strong> {p.amount} {p.currency}
              </p>
              <p>
                <strong>Provider:</strong> {p.provider}
              </p>
              <p>
                <strong>Status:</strong> {p.status}
              </p>
              {p.beneficiaryName && (
                <p>
                  <strong>Beneficiary:</strong> {p.beneficiaryName}
                </p>
              )}
              <p>
                <strong>Date:</strong>{" "}
                {new Date(p.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
