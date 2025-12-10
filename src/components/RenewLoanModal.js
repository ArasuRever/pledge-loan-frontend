import React, { useState } from 'react';
import axios from 'axios';

// Styles
const overlayStyle = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 };
const contentStyle = { backgroundColor: 'white', padding: '25px', borderRadius: '10px', width: '90%', maxWidth: '500px', boxShadow: '0 5px 15px rgba(0,0,0,0.3)' };

const RenewLoanModal = ({ loan, outstandingInterest, currentPrincipal, onClose, onRenewalSuccess }) => {
  const API_URL = process.env.REACT_APP_API_URL;
  
  const [formData, setFormData] = useState({
    newBookLoanNumber: '',
    interestPaid: '',
    principalPaid: '',    
    principalAdded: '',   
    newInterestRate: loan.interest_rate
  });
  const [deductInterest, setDeductInterest] = useState(false); // NEW STATE
  const [loading, setLoading] = useState(false);
  
  // --- CALCULATIONS ---
  const oldPrincipal = parseFloat(currentPrincipal) || parseFloat(loan.principal_amount) || 0;
  const totalInterestDue = parseFloat(outstandingInterest) || 0;
  
  const interestPaidNow = parseFloat(formData.interestPaid) || 0;
  const principalPaidNow = parseFloat(formData.principalPaid) || 0;
  const principalAddedNow = parseFloat(formData.principalAdded) || 0;
  
  const unpaidInterest = Math.max(0, totalInterestDue - interestPaidNow);
  
  const newPrincipal = Math.max(0, oldPrincipal + unpaidInterest - principalPaidNow + principalAddedNow);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let confirmMsg = "This will CLOSE the current loan and CREATE a new one.\n\n";
    confirmMsg += `--------------------------------\n`;
    confirmMsg += `Old Principal:    ₹${oldPrincipal.toFixed(2)}\n`;
    if (unpaidInterest > 0) confirmMsg += `+ Unpaid Int:     ₹${unpaidInterest.toFixed(2)}\n`;
    if (principalPaidNow > 0) confirmMsg += `- Principal Pd:   ₹${principalPaidNow.toFixed(2)}\n`;
    if (principalAddedNow > 0) confirmMsg += `+ Extra Top-up:   ₹${principalAddedNow.toFixed(2)}\n`;
    confirmMsg += `--------------------------------\n`;
    confirmMsg += `NEW PRINCIPAL:    ₹${newPrincipal.toFixed(2)}\n`;
    if (deductInterest) confirmMsg += `(First month interest will be marked as paid)\n`;
    confirmMsg += `--------------------------------\n\n`;
    confirmMsg += "Proceed with Renewal?";

    if (!window.confirm(confirmMsg)) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/loans/${loan.id}/renew`, {
          ...formData,
          interestPaid: interestPaidNow,
          principalPaid: principalPaidNow,
          principalAdded: principalAddedNow,
          newPrincipal: newPrincipal,
          deductFirstMonthInterest: deductInterest // Send Flag
      }, {
          headers: { 'Authorization': `Bearer ${token}` }
      });
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
        
        {/* Info Header */}
        <div className="alert alert-light border mb-3 small py-2">
            <div className="d-flex justify-content-between">
                <span>Current Principal:</span>
                <strong>₹{oldPrincipal.toFixed(2)}</strong>
            </div>
            <div className="d-flex justify-content-between text-danger">
                <span>Total Interest Due:</span>
                <strong>₹{totalInterestDue.toFixed(2)}</strong>
            </div>
        </div>

        <form onSubmit={handleSubmit}>
            <div className="row g-2 mb-3">
                <div className="col-8">
                    <label className="form-label fw-bold small">New Book Loan # <span className="text-danger">*</span></label>
                    <input type="text" className="form-control form-control-sm" required value={formData.newBookLoanNumber} onChange={(e) => setFormData({...formData, newBookLoanNumber: e.target.value})} placeholder="New Number" />
                </div>
                <div className="col-4">
                    <label className="form-label fw-bold small">New Rate %</label>
                    <input type="number" step="0.01" className="form-control form-control-sm" required value={formData.newInterestRate} onChange={(e) => setFormData({...formData, newInterestRate: e.target.value})} />
                </div>
            </div>
            
            <hr className="my-2 opacity-25" />

            {/* PAYMENTS SECTION */}
            <div className="mb-2">
                <label className="form-label fw-bold small text-success">1. Payments (Money In)</label>
                <div className="row g-2">
                    <div className="col-6">
                        <input type="number" className="form-control form-control-sm border-success" value={formData.interestPaid} onChange={(e) => setFormData({...formData, interestPaid: e.target.value})} placeholder="Interest Pay" />
                    </div>
                    <div className="col-6">
                        <input type="number" className="form-control form-control-sm border-success" value={formData.principalPaid} onChange={(e) => setFormData({...formData, principalPaid: e.target.value})} placeholder="Principal Pay" />
                    </div>
                </div>
            </div>

            {/* TOP-UP SECTION */}
            <div className="mb-2">
                <label className="form-label fw-bold small text-primary">2. Additional Top-up (Money Out)</label>
                <input type="number" className="form-control form-control-sm border-primary bg-primary bg-opacity-10" value={formData.principalAdded} onChange={(e) => setFormData({...formData, principalAdded: e.target.value})} placeholder="Enter amount given to customer" />
            </div>

            {/* NEW: DEDUCT INTEREST CHECKBOX */}
            <div className="form-check mb-3">
                <input 
                    className="form-check-input" 
                    type="checkbox" 
                    id="deductIntCheck" 
                    checked={deductInterest}
                    onChange={(e) => setDeductInterest(e.target.checked)}
                />
                <label className="form-check-label small text-muted" htmlFor="deductIntCheck">
                    Deduct 1st Month Interest (Upfront Payment)
                </label>
            </div>

            {/* Dynamic Summary */}
            <div className="card bg-light border-0">
                <div className="card-body p-2 small">
                    <div className="d-flex justify-content-between"><span>Old Principal</span><span>{oldPrincipal.toFixed(2)}</span></div>
                    {unpaidInterest > 0 && <div className="d-flex justify-content-between text-danger"><span>+ Unpaid Interest</span><span>{unpaidInterest.toFixed(2)}</span></div>}
                    {principalPaidNow > 0 && <div className="d-flex justify-content-between text-success"><span>- Paid Principal</span><span>-{principalPaidNow.toFixed(2)}</span></div>}
                    {principalAddedNow > 0 && <div className="d-flex justify-content-between text-primary"><span>+ Extra Top-up</span><span>+{principalAddedNow.toFixed(2)}</span></div>}
                    <div className="border-top my-1"></div>
                    <div className="d-flex justify-content-between fw-bold fs-6">
                        <span>New Loan Principal</span>
                        <span>₹{newPrincipal.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div className="d-grid gap-2 mt-3">
                <button type="submit" className="btn btn-success py-2 fw-bold" disabled={loading}>
                    {loading ? 'Processing...' : 'CONFIRM RENEWAL'}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default RenewLoanModal;