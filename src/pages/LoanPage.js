// src/pages/LoanPage.js
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import PaymentForm from '../components/PaymentForm';
import { PrintableInvoice } from '../components/PrintableInvoice';
import LoanHistoryModal from '../components/LoanHistoryModal';

const API_URL = process.env.REACT_APP_API_URL; 

// --- Modal Styles ---
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
  width: '80%',
  maxWidth: '800px',
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
const hiddenPrintComponentStyle = {
    position: 'absolute',
    overflow: 'hidden',
    clip: 'rect(0 0 0 0)',
    height: '1px',
    width: '1px',
    margin: '-1px',
    padding: '0',
    border: '0',
    top: '-9999px',
    left: '-9999px',
};
// --- End Modal Styles ---

function LoanPage({ userRole }) {
    const { id } = useParams();
    
    // --- State variables ---
    const [loanData, setLoanData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [discount, setDiscount] = useState('');
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false); 
    const [additionalAmount, setAdditionalAmount] = useState('');
    
    // --- New State for Backend Calculated Values ---
    const [calculatedInterest, setCalculatedInterest] = useState(0);
    const [calculatedTotalOwed, setCalculatedTotalOwed] = useState(0);
    const [disbursementDetails, setDisbursementDetails] = useState([]); 

    // --- Ref ---
    const invoiceRef = useRef();
    const navigate = useNavigate();

    // --- Handlers (Unchanged logic, just calling APIs) ---
    const handleReactPrint = useReactToPrint({ content: () => invoiceRef.current, documentTitle: `Loan-Invoice-${id}`, onAfterPrint: () => setShowPrintModal(false), onPrintError: (err) => { console.error("Print Error:", err); alert("Printing failed."); setShowPrintModal(false); } });
    
    const handleSavePdf = async () => { 
        if (!invoiceRef.current) return;
        const elementToCapture = invoiceRef.current; 
        const parentDiv = elementToCapture.parentNode; 
        let originalParentStyle = {};
        try {
            originalParentStyle = { ...parentDiv.style };
            Object.assign(parentDiv.style, { position: 'absolute', top: '0', left: '0', visibility: 'visible', height: 'auto', width: 'auto', overflow: 'visible', clip: 'auto', margin: '0', padding: '0', border: 'none', whiteSpace: 'normal', backgroundColor: '#ffffff' });
            await new Promise(resolve => setTimeout(resolve, 150));
            const canvas = await html2canvas(elementToCapture, { scale: 2, useCORS: true, logging: true, backgroundColor: '#ffffff', width: elementToCapture.scrollWidth, height: elementToCapture.scrollHeight });
            Object.assign(parentDiv.style, originalParentStyle);
            const imgData = canvas.toDataURL('image/png'); 
            const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' }); 
            const imgProps=pdf.getImageProperties(imgData);
            const pdfMargin=10;
            const pdfWidth=pdf.internal.pageSize.getWidth()-2*pdfMargin;
            const pdfHeight=(imgProps.height*pdfWidth)/imgProps.width;
            let heightLeft=pdfHeight;
            let position=pdfMargin;
            pdf.addImage(imgData,'PNG',pdfMargin,position,pdfWidth,pdfHeight);
            pdf.save(`Loan-Invoice-${id}.pdf`); 
            setShowPrintModal(false);
        } catch (err) { 
            console.error("PDF Generation Error:", err); 
            alert("PDF Generation Failed."); 
            if (parentDiv) Object.assign(parentDiv.style, originalParentStyle); 
            setShowPrintModal(false); 
        }
    };

    const handleSettleAndClose = async () => { 
        const discountValue = parseFloat(discount) || 0;
        if (window.confirm(`Settle this loan with a discount of ₹${discountValue.toFixed(2)}. Proceed?`)) {
            try { 
                // Note: You might want to add a field for 'settlementAmount' in the UI later if needed
                // For now, assuming full payment of remaining balance - discount
                const response = await axios.post(`${API_URL}/api/loans/${id}/settle`, { discountAmount: discountValue, settlementAmount: 0 }); 
                alert(response.data.message); setRefreshTrigger(t => t + 1); 
            }
            catch (err) { 
                if (err.response?.data?.error) { alert(err.response.data.error); } 
                else { console.error("Settle Error:", err); alert('Settle failed.'); } 
            }
        }
    };

    const handleAddPrincipal = async () => { 
        const amountValue = parseFloat(additionalAmount);
        if (!amountValue || amountValue <= 0) { alert('Please enter a valid positive amount.'); return; }
        if (window.confirm(`Add ₹${amountValue.toFixed(2)} to the principal?`)) {
            try { 
                const response = await axios.post(`${API_URL}/api/loans/${id}/add-principal`, { additionalAmount: amountValue }); 
                alert(response.data.message); setAdditionalAmount(''); setRefreshTrigger(t => t + 1); 
            }
            catch (err) { if (err.response?.data?.error) { alert(`Error: ${err.response.data.error}`); } else { console.error("Add Principal Error:", err); alert('Add principal failed.'); } }
        }
    };

    const handleDeleteLoan = async () => { 
      if (window.confirm("Are you sure? This will move the loan to the recycle bin. This can only be done for 'Paid' or 'Forfeited' loans.")) {
        try {
          const response = await axios.delete(`${API_URL}/api/loans/${id}`);
          alert(response.data.message);
          navigate(`/customers/${loanData.loanDetails.customer_id}`); 
        } catch (err) {
          console.error("Delete Loan Error:", err);
          alert("Failed to delete loan.");
        }
      }
    };
    // --- End Handlers ---

    // Fetch Loan Data
    useEffect(() => {
        const fetchLoanData = async () => {
            setIsLoading(true); setError(null);
            setDisbursementDetails([]); 
            try {
                const response = await axios.get(`${API_URL}/api/loans/${id}`);
                setLoanData(response.data);
                
                // --- 1. USE BACKEND CALCULATIONS ---
                if (response.data?.calculated) {
                    setCalculatedInterest(response.data.calculated.totalInterestOwed);
                    setCalculatedTotalOwed(response.data.calculated.amountDue); // Or totalOwed depending on display preference
                }
                // --- 2. USE BACKEND BREAKDOWN ---
                if (response.data?.interestBreakdown) {
                    setDisbursementDetails(response.data.interestBreakdown);
                }
            } catch (err) {
                 if (err.response?.status === 404) { setError("Loan not found."); } 
                 else { setError("An error occurred fetching data."); } 
                 console.error("Fetch Error:", err);
            } finally { setIsLoading(false); }
        };
        fetchLoanData();
    }, [id, refreshTrigger]);

    // Render Logic
    if (isLoading) return <div className="text-center mt-5">Loading loan details...</div>;
    if (error) return <div className="alert alert-danger"><p>{error}</p><Link to="/">Go Home</Link></div>;
    if (!loanData?.loanDetails) return <div className="alert alert-warning">Could not load complete loan details.</div>;

    const { loanDetails, transactions } = loanData;
    const paymentsReceived = transactions?.filter(tx => tx.payment_type !== 'disbursement') || [];
    const disbursementsMade = transactions?.filter(tx => tx.payment_type === 'disbursement') || [];
    const totalPaid = paymentsReceived.reduce((sum, tx) => sum + parseFloat(tx.amount_paid || 0), 0);
    
    // Use backend values for main display
    const currentBalance = loanData.calculated.amountDue; 
    const calculatedTotalInterest = loanData.calculated.totalInterestOwed;

    const formatCurrency = (amount) => `₹${parseFloat(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const formatDate = (date) => new Date(date).toLocaleDateString('en-IN'); 
    const isDeletable = loanDetails.status === 'paid' || loanDetails.status === 'forfeited';

    return (
        <div>
            {/* Page Header */}
             <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
                 <h2>Loan Details (ID: {loanDetails.id})</h2>
                 <div>
                    <button className="btn btn-outline-secondary btn-sm me-2" onClick={() => setShowHistoryModal(true)}>
                         View History
                    </button>
                    <Link to={`/loans/${id}/edit`} className="btn btn-warning btn-sm me-2">
                         Edit Loan
                    </Link>
                    <button className="btn btn-info btn-sm" onClick={() => setShowPrintModal(true)}>
                        Print / Save Invoice
                    </button>
                    {userRole === 'admin' && isDeletable && (
                        <button className="btn btn-danger btn-sm ms-2" onClick={handleDeleteLoan}>
                            <i className="bi bi-trash me-1"></i> Delete
                        </button>
                    )}
                 </div>
            </div>

            <div className="row g-4"> 
                <div className="col-lg-8">
                    {/* Customer Info */}
                    <div className="card shadow-sm mb-4">
                        <div className="card-header">Customer Information</div>
                         <div className="card-body d-flex align-items-center">
                            {loanDetails.customer_image_url && <img src={loanDetails.customer_image_url} alt={loanDetails.customer_name} style={{ width: '60px', height: '60px', borderRadius: '50%', marginRight: '15px', objectFit: 'cover' }} />}
                            <div><h5><Link to={`/customers/${loanDetails.customer_id}`}>{loanDetails.customer_name}</Link></h5><p className="mb-0 text-muted">Phone: {loanDetails.phone_number}</p></div>
                        </div>
                    </div>

                    {/* Loan Summary */}
                    <div className="card shadow-sm mb-4">
                        <div className="card-header">Loan Summary</div>
                        <div className="card-body">
                           <div className="row">
                               <div className="col-md-6 mb-2"><strong>Book Loan #:</strong> {loanDetails.book_loan_number}</div>
                               <div className="col-md-6 mb-2"><strong>Status:</strong> <span className={`badge bg-${loanDetails.status === 'overdue' ? 'danger' : loanDetails.status === 'paid' ? 'secondary' : 'success'}`}>{loanDetails.status}</span></div>
                               <div className="col-md-6 mb-2"><strong>Principal:</strong> {formatCurrency(loanDetails.principal_amount)}</div>
                               <div className="col-md-6 mb-2"><strong>Interest Rate:</strong> {loanDetails.interest_rate}% p.m.</div>
                               <div className="col-md-6 mb-2"><strong>Pledge Date:</strong> {formatDate(loanDetails.pledge_date)}</div>
                               <div className="col-md-6 mb-2"><strong>Due Date:</strong> {loanDetails.closed_date ? formatDate(loanDetails.closed_date) + " (Closed)" : formatDate(loanDetails.due_date)}</div>
                           </div>
                        </div>
                    </div>

                    {/* Pledged Item */}
                    <div className="card shadow-sm mb-4">
                         <div className="card-header">Pledged Item</div>
                         <div className="card-body d-flex align-items-start">
                           {loanDetails.item_image_data_url && <img src={loanDetails.item_image_data_url} alt={loanDetails.description} style={{ maxWidth: '80px', maxHeight: '80px', marginRight: '15px', display: 'block', border: '1px solid #ddd', padding: '2px', borderRadius: '4px' }} />}
                           <div><p className="mb-1"><strong>Description:</strong> {loanDetails.description} ({loanDetails.item_type})</p><p className="mb-0 text-muted"><strong>Quality:</strong> {loanDetails.quality || 'N/A'} | <strong>Weight:</strong> {loanDetails.weight ? `${loanDetails.weight}g` : 'N/A'}</p></div>
                        </div>
                    </div>

                    {/* Amount Due / Summary Stats */}
                    {(loanDetails.status === 'active' || loanDetails.status === 'overdue') && (
                        <div className="card shadow-sm mb-4 border-success">
                            <div className="card-header bg-success text-white">Amount Due Calculation (as of today)</div>
                            <div className="card-body">
                                <dl className="row mb-0">
                                    <dt className="col-sm-5">Principal Amount:</dt><dd className="col-sm-7 text-end">{formatCurrency(loanDetails.principal_amount)}</dd>
                                    <dt className="col-sm-5">Total Interest Accrued:</dt><dd className="col-sm-7 text-end">{formatCurrency(calculatedTotalInterest)}</dd>
                                    <hr className='my-2'/>
                                    <dt className="col-sm-5">Total Paid:</dt><dd className="col-sm-7 text-end">({formatCurrency(totalPaid)})</dd>
                                    <hr className='my-2' style={{borderColor: '#6c757d'}}/>
                                    <dt className="col-sm-5 fs-5">Current Balance:</dt><dd className="col-sm-7 text-end fs-5">{formatCurrency(currentBalance)}</dd>
                                </dl>
                            </div>
                        </div>
                    )}

                    {/* Detailed Interest Breakdown (FROM BACKEND) */}
                    {disbursementDetails.length > 0 && (
                        <div className="card shadow-sm mb-4 border-info">
                            <div className="card-header bg-info text-dark">Detailed Interest Breakdown</div>
                            <div className="card-body">
                                <p className='small text-muted mb-2'>
                                    Calculated by the system based on {loanDetails.interest_rate}% p.m.
                                </p>
                                <table className="table table-sm table-bordered small mb-0">
                                    <thead className='table-light'>
                                        <tr>
                                            <th>Source</th>
                                            <th className='text-end'>Amount</th>
                                            <th className='text-end'>Date</th>
                                            <th className='text-end'>Months</th>
                                            <th className='text-end'>Interest</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {disbursementDetails.map((event, index) => (
                                            <tr key={index}>
                                                <td><strong>{event.label}</strong></td>
                                                <td className='text-end'>{formatCurrency(event.amount)}</td>
                                                <td className='text-end'>{formatDate(event.date)}</td>
                                                <td className='text-end'>{parseFloat(event.months).toFixed(2)}</td>
                                                <td className='text-end'>{formatCurrency(event.interest)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="table-secondary">
                                            <td colSpan="4" className='text-end fw-bold'>TOTAL INTEREST ACCRUED</td>
                                            <td className='text-end fw-bold'>{formatCurrency(calculatedTotalInterest)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    )}
                </div> 

                <div className="col-lg-4">
                     {(loanDetails.status === 'active' || loanDetails.status === 'overdue') && ( <div className="card border-info shadow-sm mb-4"> <div className="card-header bg-info text-dark">Disburse More Principal</div> <div className="card-body"> <p className="text-muted small mb-2">Add funds to the existing loan principal.</p> <div className="d-flex"> <input type="number" step="0.01" className="form-control form-control-sm me-2" value={additionalAmount} onChange={e => setAdditionalAmount(e.target.value)} placeholder="Amount (₹)"/> <button onClick={handleAddPrincipal} className="btn btn-primary btn-sm">Disburse</button> </div> </div> </div> )}
                     {(loanDetails.status === 'active' || loanDetails.status === 'overdue') && ( <div className="card border-warning shadow-sm mb-4"> <div className="card-header bg-warning text-dark">Payments & Settlement</div> <div className="card-body"> <div className="mb-4"><PaymentForm loanId={id} onPaymentAdded={() => setRefreshTrigger(t => t + 1)} /></div> <hr className="my-3"/> <div> <h6>Settle & Close Loan</h6> <div className="d-flex"> <input type="number" step="0.01" className="form-control form-control-sm me-2" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="Discount (₹)"/> <button onClick={handleSettleAndClose} className="btn btn-success btn-sm">Settle</button> </div> <small className="text-muted d-block mt-1">Enter discount, if any. Balance must be ≤ 0 to close.</small> </div> </div> </div> )}
                    
                    {/* Transaction History */}
                    <div className="card shadow-sm mb-4">
                        <div className="card-header">Transaction History</div>
                        <div className="card-body">
                           <div className="row">
                               <div className="col-12">
                                   {transactions.length > 0 ? (
                                    <ul className="list-unstyled small mb-0">
                                      {transactions.map(tx => (
                                        <li key={tx.id} className="mb-2 pb-2 border-bottom">
                                          <div className="d-flex justify-content-between">
                                              <strong>{formatDate(tx.payment_date)}</strong>
                                              <span className={tx.payment_type === 'disbursement' ? 'text-danger' : 'text-success'}>
                                                {tx.payment_type === 'disbursement' ? '+' : '-'}{formatCurrency(tx.amount_paid)}
                                              </span>
                                          </div>
                                          <div className="text-muted">
                                            {tx.payment_type.toUpperCase()}
                                            {tx.changed_by_username && <span className="ms-2 fst-italic">- by {tx.changed_by_username}</span>}
                                          </div>
                                        </li>
                                      ))}
                                    </ul>
                                   ) : (
                                    <p className="text-muted small mb-0">No transactions recorded.</p>
                                   )}
                               </div>
                           </div>
                        </div>
                    </div>
                </div> 
            </div> 

            <div className="mt-3"><Link to={`/customers/${loanDetails.customer_id}`} className="btn btn-secondary btn-sm">Back to Customer Page</Link></div>

            {showPrintModal && (
                 <div style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        <div style={modalHeaderStyle}>
                             <h5 className="modal-title">Invoice Preview (Loan #{id})</h5>
                             <button type="button" className="btn-close" onClick={() => setShowPrintModal(false)} aria-label="Close"></button>
                        </div>
                        <div style={modalBodyStyle}>
                            {loanDetails && <PrintableInvoice loanDetails={loanDetails} />}
                        </div>
                        <div style={modalFooterStyle}>
                            <button type="button" className="btn btn-secondary me-2" onClick={() => setShowPrintModal(false)}>Close</button>
                            <button type="button" className="btn btn-success me-2" onClick={handleSavePdf}>Save as PDF</button>
                            <button type="button" className="btn btn-primary" onClick={handleReactPrint}>Print</button>
                        </div>
                    </div>
                 </div>
            )}

            {showHistoryModal && (
                <LoanHistoryModal loanId={id} onClose={() => setShowHistoryModal(false)} />
            )}

            <div style={hiddenPrintComponentStyle}>
                {loanDetails && <PrintableInvoice ref={invoiceRef} loanDetails={loanDetails} />}
            </div>
        </div>
    );
}

export default LoanPage;