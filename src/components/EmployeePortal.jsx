import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Toast from "./Toast";
import styles from "./EmployeePortal.module.css";

const validSwiftCodes = {
  ABSAZAJJXXX: "Absa Bank Limited",
  AFRCZAJJXXX: "African Bank Limited",
  BIDBZAJJXXX: "Bidvest Bank Limited",
  CABLZAJJXXX: "Capitec Bank Limited",
  DISCZAJJXXX: "Discovery Bank Limited",
  FIRNZAJJXXX: "First National Bank",
  FINBZAJJXXX: "Finbond Bank Limited",
  GRIDZAJJXXX: "Grindrod Bank Limited",
  IVESZAJJXXX: "Investec Bank Limited",
  LISAZAJJXXX: "Mercantile Bank Limited",
  NEDSZAJJXXX: "Nedbank Limited",
  SBZAZAJJXXX: "Standard Bank of South Africa",
};

export default function EmployeePortal({ user }) {
  const navigate = useNavigate();
  const [token] = useState(localStorage.getItem("token"));
  const [pendingPayments, setPendingPayments] = useState([]);
  const [verifiedPayments, setVerifiedPayments] = useState([]);
  const [unverifiedPayments, setUnverifiedPayments] = useState([]);
  const [submittedPayments, setSubmittedPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState({});
  const [activeTab, setActiveTab] = useState("pending");

  useEffect(() => {
    if (!user || user.role !== "employee") {
      navigate("/login");
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!token) {
      setError("No token found. Please log in again.");
      setLoading(false);
      return;
    }

    fetch("http://localhost:5000/api/payments/pending", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setPendingPayments(data.payments || []);
      });

    fetch("http://localhost:5000/api/payments/submitted", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setSubmittedPayments(data.transactions || []);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const handleVerify = (payment) => {
    const swift = payment.swiftCode?.trim().toUpperCase();
    const isValid = validSwiftCodes.hasOwnProperty(swift);

    setVerificationStatus((prev) => ({
      ...prev,
      [payment._id]: { verifying: true },
    }));

    setTimeout(() => {
      setVerificationStatus((prev) => ({
        ...prev,
        [payment._id]: { verifying: false },
      }));

      setPendingPayments((prev) =>
        prev.filter((p) => p._id !== payment._id)
      );

      if (isValid) {
        setVerifiedPayments((prev) => [...prev, payment]);
        showToast("Payment verified successfully.", "success");
      } else {
        setUnverifiedPayments((prev) => [...prev, payment]);
        showToast("Invalid SWIFT code. Payment not verified.", "error");
      }
    }, 1500);
  };

  const handleSwiftSubmit = (payment) => {
    fetch(`http://localhost:5000/api/payments/${payment._id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: "submitted" }),
    })
      .then((res) => res.json())
      .then(() => {
        showToast("SWIFT submission successful.", "success");
        setVerifiedPayments((prev) =>
          prev.filter((p) => p._id !== payment._id)
        );
        setSubmittedPayments((prev) => [...prev, payment]);
      })
      .catch(() => {
        showToast("SWIFT submission failed.", "error");
      });
  };

  const handleReject = (payment) => {
    fetch(`http://localhost:5000/api/payments/${payment._id}/reject`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then(() => {
        showToast("Payment rejected.", "success");
        setUnverifiedPayments((prev) =>
          prev.filter((p) => p._id !== payment._id)
        );
      })
      .catch(() => {
        showToast("Failed to reject payment.", "error");
      });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
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

      <h1>Employee International Payments Portal</h1>
      <p>Manage and verify international payments below.</p>

      <button onClick={handleLogout} className={styles.logout}>
        Logout
      </button>

      <div className={styles.tabBar}>
        {["pending", "unverified", "verified", "submitted"].map((tab) => (
          <button
            key={tab}
            className={`${styles.tabButton} ${
              activeTab === tab ? styles.active : ""
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)} Payments
          </button>
        ))}
      </div>

      <h2 className={styles.tabHeading}>
        {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Payments
      </h2>

      {loading && <p>Loading payments...</p>}
      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.grid}>
        {activeTab === "pending" &&
          pendingPayments.map((payment) => (
            <div key={payment._id} className={styles.paymentCard}>
              <p><strong>Amount:</strong> {payment.amount} {payment.currency}</p>
              <p><strong>Bank Name:</strong> {payment.bankName}</p>
              <p><strong>Account Number:</strong> {payment.accountNumber}</p>
              <p><strong>Beneficiary:</strong> {payment.beneficiaryName}</p>
              <p><strong>SWIFT:</strong> {payment.swiftCode}</p>
              <p><strong>Reference:</strong> {payment.reference}</p>
              <div className={styles.buttonGroup}>
                <button
                  className={styles.verifyButton}
                  onClick={() => handleVerify(payment)}
                >
                  Verify
                </button>
              </div>
            </div>
          ))}

        {activeTab === "unverified" &&
          unverifiedPayments.map((payment) => (
            <div key={payment._id} className={styles.paymentCard}>
              <p><strong>Amount:</strong> {payment.amount} {payment.currency}</p>
              <p><strong>Bank Name:</strong> {payment.bankName}</p>
              <p><strong>Account Number:</strong> {payment.accountNumber}</p>
              <p><strong>Beneficiary:</strong> {payment.beneficiaryName}</p>
              <p><strong>SWIFT:</strong> {payment.swiftCode}</p>
              <p><strong>Reference:</strong> {payment.reference}</p>
              <div className={styles.buttonGroup}>
                <button
                  className={styles.rejectButton}
                  onClick={() => handleReject(payment)}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}

        {activeTab === "verified" &&
          verifiedPayments.map((payment) => (
            <div key={payment._id} className={styles.paymentCard}>
              <p><strong>Amount:</strong> {payment.amount} {payment.currency}</p>
              <p><strong>Bank Name:</strong> {payment.bankName}</p>
              <p><strong>Account Number:</strong> {payment.accountNumber}</p>
              <p><strong>Beneficiary:</strong> {payment.beneficiaryName}</p>
              <p><strong>SWIFT:</strong> {payment.swiftCode}</p>
              <p><strong>Reference:</strong> {payment.reference}</p>
              <button
                className={styles.swiftButton}
                onClick={() => handleSwiftSubmit(payment)}
              >
                
                SWIFT Submit
              </button>
            </div>
          ))}

        {activeTab === "submitted" &&
          submittedPayments.map((payment) => (
            <div key={payment._id} className={styles.paymentCard}>
              <p><strong>Amount:</strong> {payment.amount} {payment.currency}</p>
              <p><strong>Bank Name:</strong> {payment.bankName || "—"}</p>
              <p><strong>Account Number:</strong> {payment.accountNumber || "—"}</p>
              <p><strong>Beneficiary:</strong> {payment.beneficiaryName || "—"}</p>
              <p><strong>SWIFT:</strong> {payment.swiftCode || "—"}</p>
              <p><strong>Reference:</strong> {payment.reference || "—"}</p>
              <p><strong>Submitted:</strong> {new Date(payment.updatedAt || payment.createdAt).toLocaleString()}</p>
            </div>
          ))}
      </div>
    </div>
  );
}

