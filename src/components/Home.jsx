import React, { useEffect, useState } from "react";
import styles from "./Home.module.css";

export default function Home() {
  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({ totalSent: 0, totalReceived: 0, balance: 0 });

  useEffect(() => {
    const fetchPayments = async () => {
      if (!user?.accountNumber) return;
      try {
        const res = await fetch(`http://localhost:5000/api/payments/${user.accountNumber}`);
        const data = await res.json();
        if (res.ok) {
          setPayments(data);
          let sent = 0,
            received = 0;
          data.forEach((p) => (p.type === "transfer" ? (sent += p.amount) : (received += p.amount)));
          setStats({ totalSent: sent, totalReceived: received, balance: received - sent });
        }
      } catch (err) {
        console.error("Fetch payments error:", err);
      }
    };
    fetchPayments();
  }, [user]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning ☀️";
    if (h < 18) return "Good afternoon 🌤️";
    return "Good evening 🌙";
  };

  return (
    <div className={styles.page}>
      {/* Top Bar */}
      <header className={styles.header}>
        <div className={styles.profile}>
          <img
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.fullName || "Guest"}`}
            alt="avatar"
          />
          <div>
            <h1>{greeting()}</h1>
            <p>{user ? user.fullName : "Guest"}</p>
          </div>
        </div>
        <div className={styles.balanceBox}>
          <span>Current Balance</span>
          <h2>${stats.balance.toLocaleString()}</h2>
        </div>
      </header>

      {/* Stats Row */}
      <section className={styles.stats}>
        <div className={`${styles.statCard} ${styles.sent}`}>
          <h3>Total Sent</h3>
          <p>-${stats.totalSent.toLocaleString()}</p>
        </div>
        <div className={`${styles.statCard} ${styles.received}`}>
          <h3>Total Received</h3>
          <p>+${stats.totalReceived.toLocaleString()}</p>
        </div>
        <div className={`${styles.statCard} ${styles.neutral}`}>
          <h3>Transactions</h3>
          <p>{payments.length}</p>
        </div>
      </section>

      {/* Transaction Feed */}
      <section className={styles.transactions}>
        <h2>Recent Transactions</h2>
        {payments.length === 0 ? (
          <p className={styles.empty}>No transactions yet 🚀</p>
        ) : (
          <ul className={styles.list}>
            {payments.map((p, i) => (
              <li key={p._id} className={styles.transaction} style={{ animationDelay: `${i * 0.1}s` }}>
                <div className={styles.left}>
                  <div
                    className={`${styles.icon} ${
                      p.type === "transfer" ? styles.iconSent : styles.iconReceived
                    }`}
                  >
                    {p.type === "transfer" ? "📤" : "📥"}
                  </div>
                  <div>
                    <h4>{p.type === "transfer" ? "Transfer Sent" : "Payment Received"}</h4>
                    <p>
                      {p.type === "transfer"
                        ? `To: ${p.beneficiaryName}`
                        : `From: ${p.senderName || "Unknown"}`}
                    </p>
                  </div>
                </div>
                <div className={styles.right}>
                  <span
                    className={
                      p.type === "transfer" ? styles.amountSent : styles.amountReceived
                    }
                  >
                    {p.type === "transfer" ? "-" : "+"}${p.amount.toLocaleString()}
                  </span>
                  <small>{new Date(p.createdAt).toLocaleDateString()}</small>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
