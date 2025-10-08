import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Toast from "./Toast";
import styles from "./CustomerPortal.module.css";

export default function CustomerPortal() {
  const navigate = useNavigate();

  // Logged-in user
  const [user, setUser] = useState(null);

  // Toast notifications
  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => setToast({ message, type });

  // Step management
  const [step, setStep] = useState(1);

  // Step 1: Payment form data
  const [paymentData, setPaymentData] = useState({
    amount: "",
    currency: "",
    provider: "",
  });

  // Step 2: Beneficiary form data
  const [beneficiaryData, setBeneficiaryData] = useState({
    beneficiaryName: "",
    accountNumber: "",
    bankName: "",
    swiftCode: "",
    reference: "",
  });

  // Payment ID returned from backend
  const [paymentId, setPaymentId] = useState(null);

  // Fetch logged-in user from localStorage
  useEffect(() => {
    const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
    if (!loggedInUser?._id) {
      showToast("User not logged in", "error");
      navigate("/login");
    } else {
      setUser(loggedInUser);
    }
  }, [navigate]);

  // Handle input change
  const handlePaymentChange = (e) => {
    setPaymentData({ ...paymentData, [e.target.name]: e.target.value });
  };

  const handleBeneficiaryChange = (e) => {
    setBeneficiaryData({ ...beneficiaryData, [e.target.name]: e.target.value });
  };

  // Step 1: Submit Payment
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          accountNumber: user.accountNumber,
          amount,
          currency,
          provider 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.error || "Payment initialization failed.", "error");
        return;
      }

      setPaymentId(data.payment._id);
      showToast("Payment initialized! Proceed to beneficiary.", "success");
      setStep(2);
    } catch (err) {
      console.error(err);
      showToast("Server error. Please try again later.", "error");
    }
  };

  // Step 2: Submit Beneficiary Transfer
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountNumber: user.accountNumber, // sender account
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

      if (!response.ok) {
        showToast(data.error || "Transfer failed", "error");
        return;
      }

      showToast("Transfer completed successfully!", "success");
      setTimeout(() => navigate("/home"), 1500);
    } catch (err) {
      console.error(err);
      showToast("Server error. Please try again later.", "error");
    }
  };

  return (
    <div className={styles.container}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {user && <p>Welcome, {user.fullName} | Account: {user.accountNumber}</p>}

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
            <select name="currency" value={paymentData.currency} onChange={handlePaymentChange} required>
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
            <select name="provider" value={paymentData.provider} onChange={handlePaymentChange} required>
              <option value="">Select Provider</option>
              <option value="PayPal">PayPal</option>
              <option value="Wise">Wise</option>
              <option value="Western Union">Western Union</option>
              <option value="SWIFT">SWIFT</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
            <button type="submit" className={styles.button}>Next: Beneficiary</button>
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
            <button type="submit" className={styles.button}>Submit Transfer</button>
          </form>
        </>
      )}
    </div>
  );
}
