import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Toast from "./Toast";
import styles from "./EmployeePortal.module.css";

const validSwiftCodes = {
  "Absa Bank Limited": "ABSAZAJJXXX",
  "African Bank Limited": "AFRCZAJJXXX",
  "Bidvest Bank Limited": "BIDBZAJJXXX",
  "Capitec Bank Limited": "CABLZAJJXXX",
  "Discovery Bank Limited": "DISCZAJJ",
  "First National Bank (FNB)": "FIRNZAJJ",
  "FirstRand Bank": "FIRNZAJJRSL",
  "Grindrod Bank Limited": "GRIDZAJJXXX",
  "Investec Bank Limited": "IVESZAJJXXX",
  "Mercantile Bank Limited": "LISAZAJJXXX",
  "Nedbank Limited": "NEDSZAJJXXX",
  "Standard Bank of South Africa": "SBZAZAJJ",
};

export default function Employee({ user }) {
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

  // Redirect if not logged in or not employee
  useEffect(() => {
    if (!user || user.role !== "employee") {
      navigate("/login");
    }
  }, [user, navigate]);

  // Fetch payments from backend including rejected payments
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchPayments = async () => {
      try {
        const [pendingRes, submittedRes, rejectedRes] = await Promise.all([
          fetch("http://localhost:5000/api/payments/pending", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch("http://localhost:5000/api/payments/submitted", {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:5000/api/payments/rejected", {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const pendingData = await pendingRes.json();
        const submittedData = await submittedRes.json();
        const rejectedData = await rejectedRes.json();

        setPendingPayments(pendingData.payments || []);
        setSubmittedPayments(submittedData.payments || []);
        setUnverifiedPayments(rejectedData.payments || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load payments.");
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [token, navigate]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  // Approve payment logic with SWIFT verification
  const handleApprove = (payment) => {
    const enteredSwift = (payment.swiftCode || "").trim().toUpperCase();
    const expectedSwift = validSwiftCodes[(payment.bankName || "").trim()];
    const isValid = enteredSwift && expectedSwift && enteredSwift === expectedSwift;

    setVerificationStatus((prev) => ({
      ...prev,
      [payment._id]: { verifying: true },
    }));

    setTimeout(() => {
      setVerificationStatus((prev) => ({
        ...prev,
        [payment._id]: { verifying: false },
      }));

      // Remove from pending
      setPendingPayments((prev) => prev.filter((p) => p._id !== payment._id));

      if (isValid) {
        setVerifiedPayments((prev) => [...prev, payment]);
        showToast("Payment approved and verified successfully.", "success");
      } else {
        // Move invalid SWIFT payments to unverified
        setUnverifiedPayments((prev) => [...prev, { ...payment, status: "rejected" }]);
        showToast(
          `Incorrect SWIFT for ${payment.bankName}. Payment automatically rejected.`,
          "error"
        );

        // Update backend status
        fetch(`http://localhost:5000/api/payments/reject/${payment._id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }).catch(() =>
          showToast("Failed to update rejection status in backend.", "error")
        );
      }
    }, 1500);
  };

  // Submit verified payment to backend (SWIFT submit)
  const handleSwiftSubmit = (payment) => {
    fetch(`http://localhost:5000/api/payments/status/${payment._id}`, {
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

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // Render individual payment card
  const renderPaymentCard = (payment, status) => (
    <div
      key={payment._id}
      className={`${styles.paymentCard} ${
        status === "unverified" ? styles.unverified : ""
      }`}
    >
      <p><strong>Amount:</strong> {payment.amount} {payment.currency}</p>
      <p><strong>Bank Name:</strong> {payment.bankName || "—"}</p>
      <p><strong>Account Number:</strong> {payment.accountNumber || "—"}</p>
      <p><strong>Beneficiary:</strong> {payment.beneficiaryName || "—"}</p>
      <p><strong>SWIFT:</strong> {payment.swiftCode || "—"}</p>
      <p><strong>Reference:</strong> {payment.reference || "—"}</p>

      {status === "pending" && (
        <div className={styles.buttonGroup}>
          <button
            className={styles.verifyButton}
            onClick={() => handleApprove(payment)}
          >
            {verificationStatus[payment._id]?.verifying
              ? "Verifying..."
              : "Approve"}
          </button>
        </div>
      )}

      {status === "unverified" && (
        <p className={styles.statusError}><strong>Status:</strong> Rejected</p>
      )}

      {status === "verified" && (
        <button
          className={styles.swiftButton}
          onClick={() => handleSwiftSubmit(payment)}
        >
          SUBMIT TO SWIFT
        </button>
      )}

      {status === "submitted" && (
        <p>
          <strong>Submitted:</strong>{" "}
          {new Date(payment.updatedAt || payment.createdAt).toLocaleString()}
        </p>
      )}
    </div>
  );

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
          (pendingPayments.length > 0
            ? pendingPayments.map((payment) => renderPaymentCard(payment, "pending"))
            : <p>No pending payments at the moment.</p>)
        }

        {activeTab === "unverified" &&
          (unverifiedPayments.length > 0
            ? unverifiedPayments.map((payment) => renderPaymentCard(payment, "unverified"))
            : <p>No unverified payments at the moment.</p>)
        }

        {activeTab === "verified" &&
          (verifiedPayments.length > 0
            ? verifiedPayments.map((payment) => renderPaymentCard(payment, "verified"))
            : <p>No verified payments at the moment.</p>)
        }

        {activeTab === "submitted" &&
          (submittedPayments.length > 0
            ? submittedPayments.map((payment) => renderPaymentCard(payment, "submitted"))
            : <p>No submitted payments at the moment.</p>)
        }
      </div>
    </div>
  );
}
