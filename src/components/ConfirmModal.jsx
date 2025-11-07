import React from "react";
import styles from "./ConfirmModal.module.css";

export default function ConfirmModal({ visible, title, message, onConfirm, onCancel }) {
  if (!visible) return null;

  return (
    <div className={styles.floatingModal}>
      <h4 className={styles.title}>{title}</h4>
      <p className={styles.message}>{message}</p>
      <div className={styles.buttonGroup}>
        <button className={styles.cancelButton} onClick={onCancel}>
          Cancel
        </button>
        <button className={styles.confirmButton} onClick={onConfirm}>
          Confirm
        </button>
      </div>
    </div>
  );
}
