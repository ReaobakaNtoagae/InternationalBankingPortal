import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Transactions.module.css";
import Toast from "./Toast";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = JSON.parse(localStorage.getItem("user"));

    if (!storedUser || !storedToken) {
      navigate("/login");
      return;
    }

    const fetchTransactions = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/payments/history", {
          headers: { Authorization: `Bearer ${storedToken}` },
        });
        const data = await response.json();

        if (response.ok) {
          setTransactions(data.transactions || []);
        } else {
          setToast({
            message: data.error || "Failed to load transactions.",
            type: "error",
          });
        }
      } catch (err) {
        console.error("[Fetch Error]:", err);
        setToast({ message: "Server error. Please try again.", type: "error" });
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return styles.pending;
      case "approved":
        return styles.approved;
      case "rejected":
        return styles.rejected;
      case "submitted":
        return styles.submitted;
      case "initialized":
        return styles.initialized;
      default:
        return "";
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

      <h2 className={styles.pageTitle}>My Transactions</h2>

      <div className={styles.statusInfo}>
        <h3>🧾 Transaction Status Guide</h3>
        <div className={styles.statusGrid}>
          <div className={styles.statusItem}>
            <span className={`${styles.badge} ${styles.initialized}`}>Initialized</span>
            <p>Payment setup started but not yet submitted for processing.</p>
          </div>
          <div className={styles.statusItem}>
            <span className={`${styles.badge} ${styles.pending}`}>Pending</span>
            <p>Transfer is awaiting verification or approval.</p>
          </div>
          <div className={styles.statusItem}>
            <span className={`${styles.badge} ${styles.approved}`}>Approved</span>
            <p>Transfer has been verified and accepted.</p>
          </div>
          <div className={styles.statusItem}>
            <span className={`${styles.badge} ${styles.rejected}`}>Rejected</span>
            <p>Transfer was declined due to invalid SWIFT Code.</p>
          </div>
          <div className={styles.statusItem}>
            <span className={`${styles.badge} ${styles.submitted}`}>Submitted</span>
            <p>Verified transfer has been submitted to SWIFT.</p>
          </div>
        </div>
      </div>

      {loading ? (
        <p className={styles.loading}>Loading transactions...</p>
      ) : transactions.length > 0 ? (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Currency</th>
                <th>Bank</th>
                <th>Beneficiary</th>
                <th>SWIFT</th>
                <th>Reference</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx._id} className={styles.row}>
                  <td>{new Date(tx.createdAt).toLocaleString()}</td>
                  <td>{tx.type}</td>
                  <td>{tx.amount}</td>
                  <td>{tx.currency}</td>
                  <td>{tx.bankName || "—"}</td>
                  <td>{tx.beneficiaryName || "—"}</td>
                  <td>{tx.swiftCode || "—"}</td>
                  <td>{tx.reference || "—"}</td>
                  <td>
                    <span className={`${styles.status} ${getStatusClass(tx.status)}`}>
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className={styles.noData}>No transactions found.</p>
      )}

      <div className={styles.buttonGroup}>
        <button className={styles.primaryBtn} onClick={() => navigate("/customer-portal")}>
          Make Another Transaction
        </button>
        <button className={styles.secondaryBtn} onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}