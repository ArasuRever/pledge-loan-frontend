import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useReactToPrint } from 'react-to-print';
import { PrintableSaleReceipt } from './PrintableSaleReceipt';

const API_URL = process.env.REACT_APP_API_URL;

const hiddenPrintComponentStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '210mm',
  minHeight: '297mm',
  zIndex: -1000,
  opacity: 0,
  pointerEvents: 'none',
  backgroundColor: 'white'
};

const ForfeitLoanModal = ({ loan, stats, userRole, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState('forfeit'); 
  const [salePrice, setSalePrice] = useState('');
  const [notes, setNotes] = useState('');
  const [signatureFile, setSignatureFile] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const receiptRef = useRef(null);
  
  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
    documentTitle: `Sale-Receipt-${loan.book_loan_number || 'Loan'}`,
    onBeforeGetContent: () => {
        if (!receiptRef.current) return Promise.reject("Print Error: Ref missing");
    },
    onPrintError: (error) => console.error("Print Failed:", error),
  });

  const onPrintClick = () => { if(handlePrint) handlePrint(); };

  // --- CALCULATION LOGIC ---
  const principal = parseFloat(stats?.outstandingPrincipal || 0);
  const interest = parseFloat(stats?.outstandingInterest || 0); 
  const sellingPrice = parseFloat(salePrice || 0);
  
  // As requested: Entered Amount + Outstanding Principal + Outstanding Interest
  const totalSum = sellingPrice + principal + interest;

  const canSell = ['admin', 'manager', 'super admin'].includes(userRole);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (activeTab === 'sell') {
      if (!canSell) return alert("Permission Denied: Admins only.");
      if (sellingPrice <= 0) return alert("Enter valid Sale Price.");
    }

    const confirmMsg = activeTab === 'sell' 
      ? `Confirm SALE?\n\nPrice: ₹${sellingPrice}\nTotal Ref: ₹${totalSum.toLocaleString()}\nThis will CLOSE the loan.` 
      : `Confirm FORFEITURE?\n\nMark item as seized?`;

    if (!window.confirm(confirmMsg)) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      formData.append('salePrice', activeTab === 'sell' ? salePrice : 0);
      formData.append('notes', notes);
      if (signatureFile) formData.append('signature', signatureFile);
      if (photoFile) formData.append('photo', photoFile);

      const response = await axios.post(
        `${API_URL}/api/loans/${loan.id}/forfeit`,
        formData,
        { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
      );

      alert(response.data.message);
      onSuccess(); 
    } catch (err) {
      console.error("Action Error:", err);
      alert(err.response?.data?.error || "Failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <div style={styles.overlay}>
      <div style={styles.modal} className="shadow-lg d-flex flex-column">
        
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
          <h5 className="mb-0 fw-bold text-dark"><i className="bi bi-shield-lock-fill me-2"></i>Close Loan</h5>
          <button type="button" className="btn-close" onClick={onClose} disabled={loading}></button>
        </div>

        {/* Tabs */}
        <ul className="nav nav-pills nav-fill mb-4 bg-light rounded p-1 border">
          <li className="nav-item"><button type="button" className={`nav-link fw-bold ${activeTab === 'forfeit' ? 'active bg-secondary text-white' : 'text-muted'}`} onClick={() => setActiveTab('forfeit')}>Forfeit / Seize</button></li>
          <li className="nav-item"><button type="button" className={`nav-link fw-bold ${activeTab === 'sell' ? 'active bg-danger text-white' : 'text-muted'}`} onClick={() => setActiveTab('sell')}>Sell / Auction</button></li>
        </ul>

        <form onSubmit={handleSubmit} className="flex-grow-1 d-flex flex-column">
          
          {activeTab === 'forfeit' && (
            <div className="alert alert-secondary small border-0 bg-secondary bg-opacity-10 text-secondary mb-3">
              <i className="bi bi-info-circle-fill me-2"></i>Mark item as <strong>Seized</strong>. No cash transaction.
            </div>
          )}

          {/* --- SELL TAB (UPDATED) --- */}
          {activeTab === 'sell' && (
            <div className="mb-3 animate__animated animate__fadeIn">
              {!canSell ? (
                <div className="alert alert-danger small"><strong>Restricted:</strong> Admins/Managers only.</div>
              ) : (
                <div className="card border-danger border-opacity-25 bg-danger bg-opacity-10 mb-3">
                  <div className="card-body p-3">
                    <div className="d-flex justify-content-between small text-muted mb-2 border-bottom border-danger border-opacity-25 pb-2">
                         <span>Loan: <strong>#{loan.book_loan_number}</strong></span>
                         <span>Item: <strong>{loan.item_type}</strong></span>
                    </div>

                    {/* Sale Input */}
                    <div className="mb-3">
                      <label className="form-label small fw-bold text-danger">Selling Price (₹)</label>
                      <input type="number" className="form-control fw-bold text-danger" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} placeholder="Enter Sale Amount" autoFocus />
                    </div>

                    {/* Dynamic Calculation Display */}
                    <div className="bg-white p-2 rounded border border-danger border-opacity-10">
                        <div className="small fw-bold text-muted mb-1 border-bottom pb-1">Calculation Breakdown</div>
                        
                        <div className="d-flex justify-content-between small">
                            <span className="text-muted">Sale Amount:</span>
                            <span className="fw-bold text-dark">₹{sellingPrice.toLocaleString()}</span>
                        </div>
                        
                        <div className="d-flex justify-content-between small mt-1">
                            <span className="text-muted">Outstanding Principal:</span>
                            <span className="text-dark">+ ₹{principal.toLocaleString()}</span>
                        </div>
                        
                        <div className="d-flex justify-content-between small">
                            <span className="text-muted">Outstanding Interest:</span>
                            <span className="text-dark">+ ₹{interest.toLocaleString()}</span>
                        </div>

                        <div className="border-top my-1 border-secondary border-opacity-25"></div>
                        
                        <div className="d-flex justify-content-between small">
                            {/* UPDATED: Shows Sum of Sale + Principal + Interest */}
                            <span className="fw-bold text-muted">Total (Sale + Outstanding Principal + Outstanding Interest):</span>
                            <span className="fw-bold text-danger">₹{totalSum.toLocaleString()}</span>
                        </div>
                    </div>

                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mb-3">
            <label className="form-label small fw-bold text-muted">Notes</label>
            <textarea className="form-control" rows="2" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Remarks..."></textarea>
          </div>

          <div className="row g-2 mb-4">
            <div className="col-6"><label className="form-label small fw-bold text-muted">Signature</label><input type="file" className="form-control form-control-sm" accept="image/*" onChange={(e) => setSignatureFile(e.target.files[0])} /></div>
            <div className="col-6"><label className="form-label small fw-bold text-muted">Photo Proof</label><input type="file" className="form-control form-control-sm" accept="image/*" onChange={(e) => setPhotoFile(e.target.files[0])} /></div>
          </div>

          <div className="mt-auto d-flex justify-content-between gap-2">
             {activeTab === 'sell' && (
                 <button type="button" className="btn btn-outline-dark border shadow-sm" onClick={onPrintClick}>
                    <i className="bi bi-printer me-1"></i> Print
                 </button>
             )}
             <div className="d-flex gap-2 ms-auto">
                <button type="button" className="btn btn-light border" onClick={onClose} disabled={loading}>Cancel</button>
                <button type="submit" className={`btn fw-bold px-4 ${activeTab === 'sell' ? 'btn-danger' : 'btn-secondary'}`} disabled={loading || (activeTab === 'sell' && !canSell)}>
                    {loading ? 'Processing...' : (activeTab === 'sell' ? 'CONFIRM SALE' : 'CONFIRM SEIZURE')}
                </button>
             </div>
          </div>
        </form>
      </div>
    </div>
    
    <div style={hiddenPrintComponentStyle}>
        <PrintableSaleReceipt 
            ref={receiptRef} 
            loan={loan} 
            stats={{ outstandingPrincipal: principal, outstandingInterest: interest }} 
            salePrice={salePrice} 
            buyerNotes={notes} 
        />
    </div>
    </>
  );
};

const styles = {
  overlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 },
  modal: { backgroundColor: 'white', padding: '24px', borderRadius: '16px', width: '95%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }
};

export default ForfeitLoanModal;