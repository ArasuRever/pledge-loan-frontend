// src/components/LoanHistoryModal.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

// --- Modal Styles (CLEANED) ---
const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1050,
};
const modalContentStyle = {
  backgroundColor: 'white',
  padding: '20px',
  borderRadius: '8px',
  width: '90%',
  maxWidth: '700px',
  maxHeight: '85vh',
  overflowY: 'auto',
  border: '1px solid #ccc',
  boxShadow: '0 5px 15px rgba(0, 0, 0, 0.2)',
};
const modalHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: '1px solid #eee',
  paddingBottom: '10px',
  marginBottom: '15px',
};
const modalBodyStyle = { marginBottom: '20px' };
const modalFooterStyle = {
  borderTop: '1px solid #eee',
  paddingTop: '15px',
  textAlign: 'right',
};
// --- End Modal Styles ---

// --- Helper component to render the correct log type ---
const HistoryLogRow = ({ log }) => {
  // Case 1: It's a financial transaction
  if (log.event_type === 'transaction') {
    const amount = parseFloat(log.amount_paid).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    
    const isDisbursement = log.payment_type === 'disbursement';
    const textClass = isDisbursement ? 'text-danger' : 'text-success';
    const description = isDisbursement ? 'Disbursed' : `Payment (${log.payment_type})`;

    return (
      <tr>
        <td>{new Date(log.changed_at).toLocaleString()}</td>
        <td>{log.changed_by_username || 'system'}</td>
        <td colSpan="3">
          <strong className={textClass}>{description}: {amount}</strong>
        </td>
      </tr>
    );
  }

  // Case 2: It's an edit
  return (
    <tr>
      <td>{new Date(log.changed_at).toLocaleString()}</td>
      <td>{log.changed_by_username}</td>
      <td><strong>{log.field_changed}</strong></td>
      <td><span className="text-muted">{log.old_value}</span></td>
      <td><span className="text-dark">{log.new_value}</span></td>
    </tr>
  );
};

function LoanHistoryModal({ loanId, onClose }) {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!loanId) return;
      setIsLoading(true);
      setError(null);
      try {
        // This endpoint now returns the combined list
        const response = await axios.get(`${API_URL}/api/loans/${loanId}/history`);
        setHistory(response.data);
      } catch (err) {
        console.error("Error fetching loan history:", err);
        setError("Failed to load history.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, [loanId]);

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
        <div style={modalHeaderStyle}>
          <h5 className="modal-title">Combined Loan History (Loan #{loanId})</h5>
          <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
        </div>
        <div style={modalBodyStyle}>
          {isLoading ? (
            <div className="text-center"><div className="spinner-border spinner-border-sm" role="status"><span className="visually-hidden">Loading...</span></div></div>
          ) : error ? (
            <div className="alert alert-danger">{error}</div>
          ) : history.length === 0 ? (
            <div className="alert alert-info">No history found for this loan.</div>
          ) : (
            <table className="table table-striped table-sm">
              <thead>
                <tr>
                  <th>Date / Time</th>
                  <th>User</th>
                  <th>Field / Event</th>
                  <th>Old Value</th>
                  <th>New Value</th>
                </tr>
              </thead>
              <tbody>
                {history.map((log, index) => (
                  <HistoryLogRow key={log.id || index} log={log} />
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div style={modalFooterStyle}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default LoanHistoryModal;