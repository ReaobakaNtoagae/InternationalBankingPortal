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
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch pending payments");
        return res.json();
      })
      .then((data) => {
        const uniquePayments = Array.from(
          new Map(data.payments.map((p) => [p._id, p])).values()
        );
        setPendingPayments(uniquePayments);
      })
      .catch(() => {
        setError("Unable to load pending payments.");
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
    .then((res) => {
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    })
    .then(() => {
      showToast("SWIFT submission successful.", "success");
      setVerifiedPayments((prev) =>
        prev.filter((p) => p._id !== payment._id)
      );

      fetch("http://localhost:5000/api/payments/submitted", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          setSubmittedPayments(data.transactions || []);
        });
    })
    .catch((err) => {
      console.error("❌ SWIFT Submit error:", err);
      showToast("SWIFT submission failed.", "error");
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

      {loading && <p>Loading pending payments...</p>}
      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.grid}>
        <div className={styles.column}>
          <h2>Pending Payments</h2>
          <div className={styles.paymentList}>
            {pendingPayments.map((payment) => {
              const status = verificationStatus[payment._id] || {};
              return (
                <div key={payment._id} className={styles.paymentCard}>
                  <p><strong>Amount:</strong> {payment.amount} {payment.currency}</p>
                  <p><strong>Provider:</strong> {payment.provider}</p>
                  <p><strong>Status:</strong> {payment.status}</p>
                  <p><strong>Created:</strong> {new Date(payment.createdAt).toLocaleString()}</p>
                  {payment.type === "transfer" && (
                    <>
                      <hr />
                      <p><strong>Beneficiary Name:</strong> {payment.beneficiaryName}</p>
                      <p><strong>Beneficiary Account Number:</strong> {payment.accountNumber}</p>
                      <p><strong>Bank Name:</strong> {payment.bankName}</p>
                      <p><strong>SWIFT Code:</strong> {payment.swiftCode}</p>
                      <p><strong>Reference:</strong> {payment.reference || "—"}</p>
                    </>
                  )}
                  <div className={styles.buttonGroup}>
                    <button
                      className={styles.verifyButton}
                      onClick={() => handleVerify(payment)}
                      disabled={status.verifying}
                    >
                      {status.verifying ? "Verifying..." : "Verify"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.column}>
          <h2>Unverified Payments</h2>
          <div className={styles.paymentList}>
            {unverifiedPayments.map((payment) => (
              <div key={payment._id} className={styles.paymentCard}>
                <p><strong>Amount:</strong> {payment.amount} {payment.currency}</p>
                <p><strong>Bank:</strong> {payment.bankName}</p>
                <p><strong>SWIFT:</strong> {payment.swiftCode}</p>
                <p><strong>Beneficiary:</strong> {payment.beneficiaryName}</p>
                <p><strong>Account:</strong> {payment.accountNumber}</p>
                <p><strong>Reference:</strong> {payment.reference || "—"}</p>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.column}>
          <h2>Verification Successful</h2>
          <div className={styles.paymentList}>
            {verifiedPayments.map((payment) => (
              <div key={payment._id} className={styles.paymentCard}>
                <p><strong>Amount:</strong> {payment.amount} {payment.currency}</p>
                <p><strong>Bank:</strong> {payment.bankName}</p>
                <p><strong>SWIFT:</strong> {payment.swiftCode}</p>
                <p><strong>Beneficiary:</strong> {payment.beneficiaryName}</p>
                <p><strong>Account:</strong> {payment.accountNumber}</p>
                <p><strong>Reference:</strong> {payment.reference || "—"}</p>
                <button
                  className={styles.swiftButton}
                  onClick={() => handleSwiftSubmit(payment)}
                >
                  SWIFT Submit
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.column}>
          <h2>Submitted Payments</h2>
          <div className={styles.paymentList}>
            {submittedPayments.map((payment) => (
              <div key={payment._id} className={styles.paymentCard}>
                <p><strong>Amount:</strong> {payment.amount} {payment.currency}</p>
                <p><strong>Bank:</strong> {payment.bankName}</p>
                <p><strong>SWIFT:</strong> {payment.swiftCode}</p>
                <p><strong>Beneficiary:</strong> {payment.beneficiaryName}</p>
                <p><strong>Account:</strong> {payment.accountNumber}</p>
                <p><strong>Reference:</strong> {payment.reference || "—"}</p>
                <p><strong>Submitted:</strong> {new Date().toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
