import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Toast from "./Toast";
import styles from "./CustomerPortal.module.css";

export default function CustomerPortal({ user }) {
  const navigate = useNavigate();

  const [token] = useState(localStorage.getItem("token"));
  const [toast, setToast] = useState(null);
  const [step, setStep] = useState(1);
  const [paymentId, setPaymentId] = useState(null);

  const [paymentData, setPaymentData] = useState({
    amount: "",
    currency: "",
    provider: "",
  });

  const [beneficiaryData, setBeneficiaryData] = useState({
    beneficiaryName: "",
    accountNumber: "",
    bankName: "",
    swiftCode: "",
    reference: "",
  });

  const showToast = (message, type = "success") => {
    console.log(`🔔 Toast: ${type} - ${message}`);
    setToast({ message, type });
  };

  // ✅ Redirect if user is missing or role is wrong
  useEffect(() => {
    if (!user || user.role !== "customer") {
      showToast("Access denied. Redirecting...", "error");
      navigate("/login");
    }
  }, [user, navigate]);

  if (!user || user.role !== "customer") return null;

  const handlePaymentChange = (e) => {
    setPaymentData({ ...paymentData, [e.target.name]: e.target.value });
  };

  const handleBeneficiaryChange = (e) => {
    setBeneficiaryData({ ...beneficiaryData, [e.target.name]: e.target.value });
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    const { amount, currency, provider } = paymentData;

    if (!amount || !currency || !provider) {
      showToast("Please fill in all payment fields.", "error");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          accountNumber: user.accountNumber,
          amount,
          currency,
          provider,
        }),
      });

      const data = await response.json();
      console.log("📦 Payment response:", data);

      if (!response.ok) {
        showToast(data.error || "Payment initialization failed.", "error");
        return;
      }

      setPaymentId(data.payment._id);
      showToast("Payment initialized! Proceed to beneficiary.", "success");
      setStep(2);
    } catch (err) {
      console.error("❌ Payment Error:", err);
      showToast("Server error. Please try again later.", "error");
    }
  };

  const handleBeneficiarySubmit = async (e) => {
    e.preventDefault();
    const { beneficiaryName, accountNumber, bankName, swiftCode, reference } = beneficiaryData;

    if (!beneficiaryName || !accountNumber || !bankName || !swiftCode) {
      showToast("Please fill in all required beneficiary fields.", "error");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/payments/transfer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          accountNumber: user.accountNumber,
          beneficiaryName,
          accountNumberBeneficiary: accountNumber,
          bankName,
          swiftCode,
          amount: paymentData.amount,
          currency: paymentData.currency,
          reference,
          paymentId,
        }),
      });

      const data = await response.json();
      console.log("📦 Transfer response:", data);

      if (!response.ok) {
        showToast(data.error || "Transfer failed", "error");
        return;
      }

      showToast("Transfer completed successfully!", "success");
      setTimeout(() => navigate("/home"), 1500);
    } catch (err) {
      console.error("❌ Transfer Error:", err);
      showToast("Server error. Please try again later.", "error");
    }
  };

  return (
    <div className={styles.container}>
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      <p>
        Welcome, {user.fullName} | Account: {user.accountNumber}
      </p>

      {step === 1 && (
        <>
          <h2>Step 1: Payment Details</h2>
          <form className={styles.form} onSubmit={handlePaymentSubmit}>
            <input
              type="number"
              name="amount"
              placeholder="Amount"
              value={paymentData.amount}
              onChange={handlePaymentChange}
              required
            />
            <select
              name="currency"
              value={paymentData.currency}
              onChange={handlePaymentChange}
              required
            >
              <option value="">Select Currency</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="JPY">JPY</option>
              <option value="CHF">CHF</option>
              <option value="CAD">CAD</option>
              <option value="AUD">AUD</option>
              <option value="ZAR">ZAR</option>
            </select>
            <select
              name="provider"
              value={paymentData.provider}
              onChange={handlePaymentChange}
              required
            >
              <option value="">Select Provider</option>
              <option value="PayPal">PayPal</option>
              <option value="Wise">Wise</option>
              <option value="Western Union">Western Union</option>
              <option value="SWIFT">SWIFT</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
            <button type="submit" className={styles.button}>
              Next: Beneficiary
            </button>
          </form>
        </>
      )}

      {step === 2 && (
        <>
          <h2>Step 2: Beneficiary Details</h2>
          <form className={styles.form} onSubmit={handleBeneficiarySubmit}>
            <input
              type="text"
              name="beneficiaryName"
              placeholder="Beneficiary Name"
              value={beneficiaryData.beneficiaryName}
              onChange={handleBeneficiaryChange}
              required
            />
            <input
              type="text"
              name="accountNumber"
              placeholder="Beneficiary Account Number"
              value={beneficiaryData.accountNumber}
              onChange={handleBeneficiaryChange}
              required
            />
            <input
              type="text"
              name="bankName"
              placeholder="Bank Name"
              value={beneficiaryData.bankName}
              onChange={handleBeneficiaryChange}
              required
            />
            <input
              type="text"
              name="swiftCode"
              placeholder="SWIFT Code"
              value={beneficiaryData.swiftCode}
              onChange={handleBeneficiaryChange}
              required
            />
            <input
              type="text"
              name="reference"
              placeholder="Reference (optional)"
              value={beneficiaryData.reference}
              onChange={handleBeneficiaryChange}
            />
            <button type="submit" className={styles.button}>
              Submit Transfer
            </button>
          </form>
        </>
      )}
    </div>
  );
}
