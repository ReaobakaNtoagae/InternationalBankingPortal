import React from "react";
import styles from "./Register.module.css";

export default function Register() {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Registration Disabled</h2>
      <p className={styles.message}>
        This portal does not allow public registration. <br />
        All employee accounts are created by an administrator. <br />
        Please contact your system admin if you need access.
      </p>
    </div>
  );
}
