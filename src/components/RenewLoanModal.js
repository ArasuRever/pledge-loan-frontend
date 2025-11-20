import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Styles
const overlayStyle = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 };
const contentStyle = { backgroundColor: 'white', padding: '25px', borderRadius: '10px', width: '90%', maxWidth: '500px', boxShadow: '0 5px 15px rgba(0,0,0,0.3)' };

const RenewLoanModal = ({ loan, outstandingInterest, onClose, onRenewalSuccess }) => {
  const API_URL = process.env.REACT_APP_API_URL;
  
  const [formData, setFormData] = useState({
    newBookLoanNumber: '',
    interestPaid: '', // Default empty
    newInterestRate: loan.interest_rate
  });
  const [loading, setLoading] = useState(false);
  
  // Calculate metrics for UI feedback
  const oldPrincipal = parseFloat(loan.principal_amount) || 0;
  const totalDue = parseFloat(outstandingInterest) || 0;
  const paidNow = parseFloat(formData.interestPaid) || 0;
  
  // Logic: Any interest NOT paid gets added to principal
  const unpaidInterest = Math.max(0, totalDue - paidNow);
  const newPrincipal = oldPrincipal + unpaidInterest;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let confirmMsg = "This will CLOSE the current loan and CREATE a new one.\n\n";
    if (unpaidInterest > 1) {
        confirmMsg += `⚠️ WARNING: You are not paying full interest.\n₹${unpaidInterest.toFixed(2)} will be added to the New Principal.\n\n`;
        confirmMsg += `Old Principal: ₹${oldPrincipal.toFixed(2)}\nNew Principal: ₹${newPrincipal.toFixed(2)}\n\n`;
    }
    confirmMsg += "Proceed?";

    if (!window.confirm(confirmMsg)) return;
    
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/loans/${loan.id}/renew`, formData);
      alert(response.data.message);
      onRenewalSuccess(response.data.newLoanId);
    } catch (err) {
      alert(err.response?.data?.error || "Renewal failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={overlayStyle}>
      <div style={contentStyle} className="animate__animated animate__zoomIn">
        <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="text-success fw-bold mb-0"><i className="bi bi-arrow-repeat me-2"></i>Renew Loan</h5>
            <button className="btn-close" onClick={onClose}></button>
        </div>
        
        {/* Info Box */}
        <div className="alert alert-light border mb-3 small">
            <div className="d-flex justify-content-between">
                <span>Current Principal:</span>
                <strong>₹{oldPrincipal.toFixed(2)}</strong>
            </div>
            <div className="d-flex justify-content-between text-danger">
                <span>Total Interest Due:</span>
                <strong>₹{totalDue.toFixed(2)}</strong>
            </div>
        </div>

        <form onSubmit={handleSubmit}>
            <div className="mb-3">
                <label className="form-label fw-medium">New Book Loan # <span className="text-danger">*</span></label>
                <input 
                    type="text" 
                    className="form-control" 
                    required 
                    value={formData.newBookLoanNumber}
                    onChange={(e) => setFormData({...formData, newBookLoanNumber: e.target.value})}
                    placeholder="Enter new ticket number"
                />
            </div>
            
            <div className="row">
                <div className="col-6 mb-3">
                    <label className="form-label fw-medium">Interest Paid Now</label>
                    <input 
                        type="number" 
                        className="form-control border-success" 
                        value={formData.interestPaid}
                        onChange={(e) => setFormData({...formData, interestPaid: e.target.value})}
                        placeholder="0.00"
                    />
                    <div className="form-text text-muted" style={{fontSize: '0.75rem'}}>
                        Enter 0 to add all interest to principal.
                    </div>
                </div>
                <div className="col-6 mb-3">
                    <label className="form-label fw-medium">New Rate (%)</label>
                    <input 
                        type="number" 
                        step="0.01"
                        className="form-control" 
                        required 
                        value={formData.newInterestRate}
                        onChange={(e) => setFormData({...formData, newInterestRate: e.target.value})}
                    />
                </div>
            </div>

            {/* Dynamic Preview of New Principal */}
            <div className={`alert ${unpaidInterest > 0 ? 'alert-warning' : 'alert-success'} mb-3`}>
                <h6 className="alert-heading h6 mb-1">New Loan Preview:</h6>
                <div className="d-flex justify-content-between fw-bold">
                    <span>New Principal:</span>
                    <span>₹{newPrincipal.toFixed(2)}</span>
                </div>
                {unpaidInterest > 0 && (
                    <small className="d-block mt-1 text-danger">
                        (+ ₹{unpaidInterest.toFixed(2)} unpaid interest added)
                    </small>
                )}
            </div>

            <div className="d-grid gap-2 mt-3">
                <button type="submit" className="btn btn-success py-2" disabled={loading}>
                    {loading ? 'Processing...' : 'Confirm Renewal'}
                </button>
                <button type="button" className="btn btn-light border" onClick={onClose}>Cancel</button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default RenewLoanModal;