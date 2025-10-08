import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Toast from "./Toast";
import styles from "./BeneficiaryPayment.module.css";

export default function BeneficiaryPayment() {
  const navigate = useNavigate();
  const location = useLocation();

  const paymentId = location.state?.paymentId;
  const paymentData = location.state?.paymentData || {};

  const [formData, setFormData] = useState({
    accountNumber: "",
    beneficiaryName: "",
    bankName: "",
    swiftCode: "",
    reference: "",
    amount: "",
    currency: "",
  });

  const [toast, setToast] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (message, type = "success") => {
    console.log(`[Toast] ${type.toUpperCase()}: ${message}`);
    setToast({ message, type });
  };

  useEffect(() => {
    if (!paymentId || !paymentData.amount || !paymentData.currency) {
      showToast("Missing payment details. Redirecting...", "error");
      setTimeout(() => navigate("/customer-portal"), 2000);
      return;
    }

    setFormData((prev) => ({
      ...prev,
      amount: paymentData.amount,
      currency: paymentData.currency,
    }));
  }, [paymentId, paymentData, navigate]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`[Form Change] ${name}: ${value}`);
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("[Submit] Beneficiary form data:", formData);

    const { accountNumber, beneficiaryName, bankName, swiftCode } = formData;

    if (!accountNumber || !beneficiaryName || !bankName || !swiftCode) {
      showToast("Please fill in all required fields.", "error");
      return;
    }

    let user;
    try {
      user = JSON.parse(localStorage.getItem("loggedInUser"));
      console.log("[User] Retrieved from localStorage:", user);
      if (!user || !user._id) {
        showToast("User not logged in.", "error");
        return;
      }
    } catch (err) {
      console.error("[User] JSON parse error:", err);
      showToast("Invalid user session.", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("http://localhost:5000/api/payments/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: user._id,
          paymentId,
          ...formData,
        }),
      });

      console.log("[API] POST /api/payments/transfer status:", response.status);

      let data;
      try {
        data = await response.json();
        console.log("[API] Response JSON:", data);
      } catch (jsonErr) {
        console.error("[API] JSON parse error:", jsonErr);
        showToast("Unexpected server response.", "error");
        setIsSubmitting(false);
        return;
      }

      if (response.ok) {
        showToast("Transfer completed successfully!", "success");
        setTimeout(() => navigate("/home"), 1500);
      } else {
        showToast(data.error || "Transfer failed.", "error");
      }
    } catch (err) {
      console.error("[Network] Error during fetch:", err);
      showToast("Server error. Please try again later.", "error");
    } finally {
      setIsSubmitting(false);
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

      <h2>Beneficiary Payment</h2>
      <p>Enter beneficiary account details to complete the transfer.</p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <label htmlFor="amount">Amount</label>
        <input
          type="number"
          name="amount"
          id="amount"
          value={formData.amount}
          disabled
        />

        <label htmlFor="currency">Currency</label>
        <input
          type="text"
          name="currency"
          id="currency"
          value={formData.currency}
          disabled
        />

        <label htmlFor="beneficiaryName">Beneficiary Name</label>
        <input
          type="text"
          name="beneficiaryName"
          id="beneficiaryName"
          placeholder="Full name"
          value={formData.beneficiaryName}
          onChange={handleChange}
          required
        />

        <label htmlFor="accountNumber">Account Number</label>
        <input
          type="text"
          name="accountNumber"
          id="accountNumber"
          placeholder="Account number"
          value={formData.accountNumber}
          onChange={handleChange}
          required
        />

        <label htmlFor="bankName">Bank Name</label>
        <input
          type="text"
          name="bankName"
          id="bankName"
          placeholder="Bank name"
          value={formData.bankName}
          onChange={handleChange}
          required
        />

        <label htmlFor="swiftCode">SWIFT Code</label>
        <input
          type="text"
          name="swiftCode"
          id="swiftCode"
          placeholder="SWIFT code"
          value={formData.swiftCode}
          onChange={handleChange}
          required
        />

        <label htmlFor="reference">Payment Reference (optional)</label>
        <input
          type="text"
          name="reference"
          id="reference"
          placeholder="Reference"
          value={formData.reference}
          onChange={handleChange}
        />

        <button
          type="submit"
          className={styles.button}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Processing..." : "Pay"}
        </button>
      </form>
    </div>
  );
}