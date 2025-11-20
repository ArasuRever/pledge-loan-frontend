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
import RenewLoanModal from '../components/RenewLoanModal'; // --- NEW IMPORT ---

const API_URL = process.env.REACT_APP_API_URL; 

// --- Modal Styles ---
const modalOverlayStyle = {
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex',
    justifyContent: 'center', alignItems: 'center', zIndex: 1050,
};
const modalContentStyle = {
    backgroundColor: 'white', padding: '20px', borderRadius: '8px',
    width: '80%', maxWidth: '800px', maxHeight: '85vh', overflowY: 'auto',
    border: '1px solid #ccc', boxShadow: '0 5px 15px rgba(0, 0, 0, 0.2)',
};
const modalHeaderStyle = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px',
};
const modalBodyStyle = { marginBottom: '20px' };
const modalFooterStyle = {
    borderTop: '1px solid #eee', paddingTop: '15px', textAlign: 'right',
};
const hiddenPrintComponentStyle = {
    position: 'absolute', overflow: 'hidden', clip: 'rect(0 0 0 0)',
    height: '1px', width: '1px', margin: '-1px', padding: '0', border: '0',
    top: '-9999px', left: '-9999px',
};

// --- Helper Function: calculateInterestDetails ---
const calculateInterestDetails = (loanDetails, transactions = []) => {
    if (!loanDetails || !loanDetails.pledge_date || !loanDetails.principal_amount || !loanDetails.interest_rate || loanDetails.status === 'paid' || loanDetails.status === 'forfeited') {
        return { totalInterest: 0, totalMonthsFactor: 0, rateUsed: parseFloat(loanDetails?.interest_rate || 0), totalOwed: parseFloat(loanDetails?.principal_amount || 0), disbursementEvents: [] };
    }
    const currentPrincipalTotal = parseFloat(loanDetails.principal_amount);
    const monthlyInterestRatePercent = parseFloat(loanDetails.interest_rate);
    const monthlyInterestRateDecimal = monthlyInterestRatePercent / 100;
    const pledgeDate = new Date(loanDetails.pledge_date);
    const today = new Date();
    const calculateTotalMonthsFactor = (startDate, endDate) => {
        if (endDate <= startDate) return 0;
        let fullMonthsPassed = 0;
        let tempDate = new Date(startDate);
        while (true) {
            const nextMonth = tempDate.getMonth() + 1;
            tempDate.setMonth(nextMonth);
            if (tempDate.getMonth() !== (nextMonth % 12)) tempDate.setDate(0);
            if (tempDate <= endDate) { fullMonthsPassed++; }
            else { tempDate.setMonth(tempDate.getMonth() - 1); break; }
        }
        const oneDay = 1000 * 60 * 60 * 24;
        const remainingDays = Math.floor((endDate.getTime() - tempDate.getTime()) / oneDay);
        let partialFraction = 0; let totalMonthsFactor;
        if (fullMonthsPassed === 0) { totalMonthsFactor = 1.0; }
        else { if (remainingDays > 0) { partialFraction = (remainingDays <= 15) ? 0.5 : 1.0; } totalMonthsFactor = fullMonthsPassed + partialFraction; }
        if (totalMonthsFactor === 0 && (endDate.getTime() > startDate.getTime())) { totalMonthsFactor = 0.5; }
        return totalMonthsFactor;
    };
    const disbursements = transactions.filter(tx => tx.payment_type === 'disbursement').sort((a, b) => new Date(a.payment_date) - new Date(b.payment_date));
    const disbursementsSum = disbursements.reduce((sum, tx) => sum + parseFloat(tx.amount_paid || 0), 0);
    const initialPrincipal = currentPrincipalTotal - disbursementsSum;
    let disbursementEvents = [];
    if (initialPrincipal > 0) {
        disbursementEvents.push({ amount: initialPrincipal, date: pledgeDate, isInitial: true, label: 'Initial Loan' });
    }
    disbursementEvents = disbursementEvents.concat(
        disbursements.map((row, index) => ({
            amount: parseFloat(row.amount_paid),
            date: new Date(row.payment_date),
            isInitial: false,
            label: `Top-up #${index + 1}`
        }))
    );
    let totalInterest = 0;
    let maxMonthsFactor = 0;
    for (const event of disbursementEvents) {
        if (event.amount <= 0) {
            event.monthsFactor = 0;
            event.accruedInterest = 0;
            continue;
        };
        const monthsFactor = calculateTotalMonthsFactor(event.date, today);
        event.monthsFactor = monthsFactor; 
        event.accruedInterest = event.amount * monthlyInterestRateDecimal * monthsFactor; 
        totalInterest += event.accruedInterest;
        if (event.isInitial) maxMonthsFactor = monthsFactor;
    }
    const totalMonthsFactorReport = maxMonthsFactor > 0 ? maxMonthsFactor : calculateTotalMonthsFactor(pledgeDate, today);
    const totalOwed = currentPrincipalTotal + totalInterest;
    return {
        totalInterest,
        totalMonthsFactor: totalMonthsFactorReport,
        rateUsed: monthlyInterestRatePercent,
        totalOwed,
        disbursementEvents: disbursementEvents
    };
};

// --- Main Component ---
function LoanPage({ userRole }) {
    const { id } = useParams();
    const navigate = useNavigate();

    // --- State variables ---
    const [loanData, setLoanData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [discount, setDiscount] = useState('');
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false); 
    const [showRenewModal, setShowRenewModal] = useState(false); // --- NEW STATE ---
    const [additionalAmount, setAdditionalAmount] = useState('');
    const [calculatedInterest, setCalculatedInterest] = useState(0);
    const [calculatedMonths, setCalculatedMonths] = useState(0);
    const [calculatedTotalOwed, setCalculatedTotalOwed] = useState(0);
    const [calculatedRate, setCalculatedRate] = useState(0);
    const [disbursementDetails, setDisbursementDetails] = useState([]); 

    // --- Ref ---
    const invoiceRef = useRef();
    
    // --- Handlers ---
    const handleReactPrint = useReactToPrint({ content: () => invoiceRef.current, documentTitle: `Loan-Invoice-${id}`, onAfterPrint: () => setShowPrintModal(false), onPrintError: (err) => { console.error("Print Error:", err); alert("Printing failed."); setShowPrintModal(false); } });
    
    const handleSavePdf = async () => { 
        if (!invoiceRef.current) { console.error("PDF Error: Ref missing."); alert("PDF Error: Ref missing."); setShowPrintModal(false); return; }
        const elementToCapture = invoiceRef.current; 
        const parentDiv = elementToCapture.parentNode; 
        let originalParentStyle = {};
        if (!parentDiv) { console.error("PDF Error: Parent missing."); alert("PDF Error: Parent missing."); setShowPrintModal(false); return; }
        
        try {
            originalParentStyle = { position: parentDiv.style.position, overflow: parentDiv.style.overflow, clip: parentDiv.style.clip, height: parentDiv.style.height, width: parentDiv.style.width, margin: parentDiv.style.margin, padding: parentDiv.style.padding, border: parentDiv.style.border, whiteSpace: parentDiv.style.whiteSpace, visibility: parentDiv.style.visibility, top: parentDiv.style.top, left: parentDiv.style.left, };
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
            const pageHeight=pdf.internal.pageSize.getHeight()-2*pdfMargin;
            let heightLeft=pdfHeight;
            let position=pdfMargin;
            
            pdf.addImage(imgData,'PNG',pdfMargin,position,pdfWidth,pdfHeight);
            heightLeft-=pageHeight;
            while(heightLeft>0){
                position=-(pdfHeight-heightLeft-pdfMargin);
                pdf.addPage();
                pdf.addImage(imgData,'PNG',pdfMargin,position,pdfWidth,pdfHeight);
                heightLeft-=pageHeight;
            }
            pdf.save(`Loan-Invoice-${id}.pdf`); 
            setShowPrintModal(false);
        } catch (err) { 
            console.error("PDF Generation Error:", err); 
            alert("PDF Generation Failed."); 
            if (parentDiv) { Object.assign(parentDiv.style, originalParentStyle); } 
            setShowPrintModal(false); 
        }
    };
    
    const handleSettleAndClose = async () => { 
        const discountValue = parseFloat(discount) || 0;
        const currentBalanceValue = currentBalance; 
        if (currentBalanceValue - discountValue > 0.01) {
            alert(`Settlement failed: The final amount due is ${formatCurrency(currentBalanceValue - discountValue)}. The balance must be ≤ ₹0.01 to close the loan.`);
            return;
        }
        if (window.confirm(`Settle this loan with a discount of ₹${discountValue.toFixed(2)}. Proceed?`)) {
            try { 
                const response = await axios.post(`${API_URL}/api/loans/${id}/settle`, { discountAmount: discountValue, settlementAmount: currentBalanceValue - discountValue }); 
                alert(response.data.message); 
                setRefreshTrigger(t => t + 1); 
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
                alert(response.data.message); 
                setAdditionalAmount(''); 
                setRefreshTrigger(t => t + 1); 
            }
            catch (err) { 
                if (err.response?.data?.error) { alert(`Error: ${err.response.data.error}`); } 
                else { console.error("Add Principal Error:", err); alert('Add principal failed.'); } 
            }
        }
    };
    
    const handleDeleteLoan = async () => { 
      if (!loanData?.loanDetails) return;
      if (window.confirm("Are you sure? This will move the loan to the recycle bin. This can only be done for 'Paid' or 'Forfeited' loans.")) {
        try {
          const response = await axios.delete(`${API_URL}/api/loans/${id}`);
          alert(response.data.message);
          navigate(`/customers/${loanData.loanDetails.customer_id}`);
        } catch (err) {
          const errorMsg = err.response?.data?.error || "Failed to delete loan.";
          console.error("Delete Loan Error:", err);
          alert(`Error: ${errorMsg}`);
        }
      }
    };

    // Fetch Loan Data & Calculate Interest
    useEffect(() => {
        const fetchLoanData = async () => {
            setIsLoading(true); setError(null);
            setCalculatedInterest(0); setCalculatedMonths(0); setCalculatedTotalOwed(0); setCalculatedRate(0);
            setDisbursementDetails([]); 
            try {
                const response = await axios.get(`${API_URL}/api/loans/${id}`);
                setLoanData(response.data);
                if (response.data?.loanDetails) {
                    const { totalInterest, totalMonthsFactor, rateUsed, totalOwed, disbursementEvents } = calculateInterestDetails(response.data.loanDetails, response.data.transactions);
                    setCalculatedInterest(totalInterest);
                    setCalculatedMonths(totalMonthsFactor);
                    setCalculatedRate(rateUsed);
                    setCalculatedTotalOwed(totalOwed);
                    setDisbursementDetails(disbursementEvents); 
                }
            } catch (err) {
                if (err.response?.status === 404) { setError("Loan not found."); } else { setError("An error occurred fetching data."); } console.error("Fetch Error:", err);
            } finally { setIsLoading(false); }
        };
        fetchLoanData();
    }, [id, refreshTrigger, API_URL]);

    // Render Logic
    if (isLoading) return <div className="text-center mt-5">Loading loan details...</div>;
    if (error) return <div className="alert alert-danger"><p>{error}</p><Link to="/">Go Home</Link></div>;
    if (!loanData?.loanDetails) return <div className="alert alert-warning">Could not load complete loan details.</div>;

    const { loanDetails, transactions } = loanData;
    const paymentsReceived = transactions?.filter(tx => tx.payment_type !== 'disbursement') || [];
    const disbursementsMade = transactions?.filter(tx => tx.payment_type === 'disbursement') || [];
    const totalPaid = paymentsReceived.reduce((sum, tx) => sum + parseFloat(tx.amount_paid || 0), 0);
    const currentBalance = calculatedTotalOwed - totalPaid;

    const formatCurrency = (amount) => `₹${parseFloat(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const formatDate = (date) => new Date(date).toLocaleDateString('en-IN'); 
    const isDeletable = loanDetails.status === 'paid' || loanDetails.status === 'forfeited';

    return (
        <div className="container-fluid pt-3">
            {/* Page Header */}
            <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
                <h2>Loan Details (ID: {loanDetails.id})</h2>
                <div>
                    <button className="btn btn-outline-secondary btn-sm me-2" onClick={() => setShowHistoryModal(true)}>
                        View History
                    </button>
                    
                    {/* --- RENEW BUTTON (NEW) --- */}
                    {(loanDetails.status === 'active' || loanDetails.status === 'overdue') && (
                        <button className="btn btn-success btn-sm me-2" onClick={() => setShowRenewModal(true)}>
                             <i className="bi bi-arrow-repeat me-1"></i> Renew
                        </button>
                    )}
                    {/* --- END RENEW BUTTON --- */}

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
                    {/* Customer Information Card */}
                    <div className="card shadow-sm mb-4">
                        <div className="card-header">Customer Information</div>
                        <div className="card-body d-flex align-items-center">
                            {loanDetails.customer_image_url && <img src={loanDetails.customer_image_url} alt={loanDetails.customer_name} style={{ width: '60px', height: '60px', borderRadius: '50%', marginRight: '15px', objectFit: 'cover' }} />}
                            <div><h5><Link to={`/customers/${loanDetails.customer_id}`}>{loanDetails.customer_name}</Link></h5><p className="mb-0 text-muted">Phone: {loanDetails.phone_number}</p></div>
                        </div>
                    </div>
                    {/* Loan Summary Card */}
                    <div className="card shadow-sm mb-4">
                        <div className="card-header">Loan Summary</div>
                        <div className="card-body">
                            <div className="row">
                                <div className="col-md-6 mb-2"><strong>Book Loan #:</strong> {loanDetails.book_loan_number}</div>
                                <div className="col-md-6 mb-2"><strong>Status:</strong> <span className={`badge bg-${loanDetails.status === 'overdue' ? 'danger' : loanDetails.status === 'paid' ? 'secondary' : loanDetails.status === 'renewed' ? 'info text-dark' : 'success'}`}>{loanDetails.status}</span></div>
                                <div className="col-md-6 mb-2"><strong>Principal:</strong> {formatCurrency(loanDetails.principal_amount)}</div>
                                <div className="col-md-6 mb-2"><strong>Interest Rate:</strong> {loanDetails.interest_rate}% p.m.</div>
                                <div className="col-md-6 mb-2"><strong>Pledge Date:</strong> {formatDate(loanDetails.pledge_date)}</div>
                                <div className="col-md-6 mb-2"><strong>Due Date:</strong> {formatDate(loanDetails.due_date)}</div>
                            </div>
                        </div>
                    </div>
                    {/* Pledged Item Card (UPDATED for Indian Pledge System) */}
                    <div className="card shadow-sm mb-4">
                        <div className="card-header">Pledged Item Details</div>
                        <div className="card-body">
                            <div className="d-flex align-items-start">
                                {loanDetails.item_image_data_url && (
                                    <img 
                                        src={loanDetails.item_image_data_url} 
                                        alt="Item" 
                                        className="rounded border p-1 me-3"
                                        style={{ width: '100px', height: '100px', objectFit: 'cover' }} 
                                    />
                                )}
                                <div className="flex-grow-1">
                                    <h5 className="card-title mb-1">{loanDetails.description}</h5>
                                    <span className="badge bg-info text-dark mb-3">{loanDetails.item_type?.toUpperCase()}</span>
                                    
                                    <div className="row g-2 small">
                                        <div className="col-6">
                                            <div className="text-muted">Gross Weight:</div>
                                            <div className="fw-bold">{loanDetails.gross_weight || loanDetails.weight || '0'} g</div>
                                        </div>
                                        <div className="col-6">
                                            <div className="text-muted">Net Weight:</div>
                                            <div className="fw-bold">{loanDetails.net_weight || '0'} g</div>
                                        </div>
                                        <div className="col-6">
                                            <div className="text-muted">Purity:</div>
                                            <div className="fw-bold">{loanDetails.purity || 'N/A'}</div>
                                        </div>
                                        <div className="col-6">
                                            <div className="text-muted">Appraised Value:</div>
                                            <div className="fw-bold">{formatCurrency(loanDetails.appraised_value)}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Amount Due Calculation Card */}
                    {(loanDetails.status === 'active' || loanDetails.status === 'overdue') && (
                        <div className="card shadow-sm mb-4 border-success">
                            <div className="card-header bg-success text-white">Amount Due Calculation (as of today)</div>
                            <div className="card-body">
                                <dl className="row mb-0">
                                    <dt className="col-sm-5">Principal Amount:</dt><dd className="col-sm-7 text-end">{formatCurrency(loanDetails.principal_amount)}</dd>
                                    <dt className="col-sm-5">Interest Accrued:</dt><dd className="col-sm-7 text-end">{formatCurrency(calculatedInterest)}</dd>
                                    <dt className="col-sm-5 text-muted small pt-1">Calculation:</dt><dd className="col-sm-7 text-end text-muted small pt-1">{calculatedMonths} months @ {calculatedRate}% p.m.</dd>
                                    <hr className='my-2'/><dt className="col-sm-5 fw-bold">Total Amount Due:</dt><dd className="col-sm-7 text-end fw-bold">{formatCurrency(calculatedTotalOwed)}</dd>
                                    <dt className="col-sm-5">Total Paid:</dt><dd className="col-sm-7 text-end">({formatCurrency(totalPaid)})</dd>
                                    <hr className='my-2' style={{borderColor: '#6c757d'}}/><dt className="col-sm-5 fs-5">Current Balance:</dt><dd className="col-sm-7 text-end fs-5">{formatCurrency(currentBalance)}</dd>
                                </dl>
                            </div>
                        </div>
                    )}

                    {/* Detailed Interest Breakdown Card */}
                    {(loanDetails.status === 'active' || loanDetails.status === 'overdue') && disbursementDetails.length > 0 && (
                        <div className="card shadow-sm mb-4 border-info">
                            <div className="card-header bg-info text-dark">Detailed Interest Breakdown</div>
                            <div className="card-body">
                                <p className='small text-muted mb-2'>Interest is calculated separately for each principal disbursement from its effective start date using the loan rate of {calculatedRate}% p.m.</p>
                                <table className="table table-sm table-bordered small mb-0">
                                    <thead className='table-light'>
                                        <tr>
                                            <th>Source / Date</th>
                                            <th className='text-end'>Principal Amount</th>
                                            <th className='text-end'>Months Factor</th>
                                            <th className='text-end'>Interest Accrued</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {disbursementDetails.map((event, index) => (
                                            <tr key={index}>
                                                <td>
                                                    <strong>{event.label}</strong>
                                                    <small className='d-block text-muted'>{formatDate(event.date)}</small>
                                                </td>
                                                <td className='text-end'>{formatCurrency(event.amount)}</td>
                                                <td className='text-end'>{event.monthsFactor.toFixed(1)}</td>
                                                <td className='text-end'>{formatCurrency(event.accruedInterest)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="table-secondary">
                                            <td colSpan="3" className='text-end fw-bold'>TOTAL INTEREST ACCRUED</td>
                                            <td className='text-end fw-bold'>{formatCurrency(calculatedInterest)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    )}
                </div> 

                <div className="col-lg-4">
                    {/* Disburse More Principal Card */}
                    {(loanDetails.status === 'active' || loanDetails.status === 'overdue') && ( 
                        <div className="card border-info shadow-sm mb-4"> 
                            <div className="card-header bg-info text-dark">Disburse More Principal</div> 
                            <div className="card-body"> 
                                <p className="text-muted small mb-2">Add funds to the existing loan principal.</p> 
                                <div className="d-flex"> 
                                    <input type="number" step="0.01" className="form-control form-control-sm me-2" value={additionalAmount} onChange={e => setAdditionalAmount(e.target.value)} placeholder="Amount (₹)"/> 
                                    <button onClick={handleAddPrincipal} className="btn btn-primary btn-sm">Disburse</button> 
                                </div> 
                            </div> 
                        </div> 
                    )}
                    
                    {/* Payments & Settlement Card */}
                    {(loanDetails.status === 'active' || loanDetails.status === 'overdue') && ( 
                        <div className="card border-warning shadow-sm mb-4"> 
                            <div className="card-header bg-warning text-dark">Payments & Settlement</div> 
                            <div className="card-body"> 
                                <div className="mb-4">
                                    <PaymentForm loanId={id} onPaymentAdded={() => setRefreshTrigger(t => t + 1)} />
                                </div> 
                                <hr className="my-3"/> 
                                <div> 
                                    <h6>Settle & Close Loan</h6> 
                                    <div className="d-flex"> 
                                        <input type="number" step="0.01" className="form-control form-control-sm me-2" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="Discount (₹)"/> 
                                        <button onClick={handleSettleAndClose} className="btn btn-success btn-sm">Settle</button> 
                                    </div> 
                                    <small className="text-muted d-block mt-1">Enter discount, if any. Balance must be ≤ 0 to close.</small> 
                                </div> 
                            </div> 
                        </div> 
                    )}
                    
                    {/* Transaction History Card */}
                    <div className="card shadow-sm mb-4">
                        <div className="card-header">Transaction History</div>
                        <div className="card-body">
                            <div className="row">
                                <div className="col-6 border-end pe-2">
                                    <h6>Payments Received</h6>
                                    {paymentsReceived.length > 0 ? (
                                        <ul className="list-unstyled small mb-0">
                                            {paymentsReceived.map(tx => (
                                                <li key={tx.id} className="mb-2">
                                                    <div>{formatDate(tx.payment_date)}: <strong>{formatCurrency(tx.amount_paid)}</strong> ({tx.payment_type})</div>
                                                    {tx.changed_by_username && (
                                                        <small className="text-muted">by: {tx.changed_by_username}</small>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-muted small mb-0">No payments received.</p>
                                    )}
                                </div>
                                <div className="col-6 ps-2">
                                    <h6>Disbursements</h6>
                                    {disbursementsMade.length > 0 ? (
                                        <ul className="list-unstyled small mb-0">
                                            {disbursementsMade.map(tx => (
                                                <li key={tx.id} className="mb-2">
                                                    <div>{formatDate(tx.payment_date)}: <strong>{formatCurrency(tx.amount_paid)}</strong></div>
                                                    {tx.changed_by_username && (
                                                        <small className="text-muted">by: {tx.changed_by_username}</small>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-muted small mb-0">No additional disbursements.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div> 
            </div> 

            <div className="mt-3"><Link to={`/customers/${loanDetails.customer_id}`} className="btn btn-secondary btn-sm">Back to Customer Page</Link></div>

            {/* Print Preview Modal */}
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

            {/* Loan History Modal */}
            {showHistoryModal && (
                <LoanHistoryModal loanId={id} onClose={() => setShowHistoryModal(false)} />
            )}

            {/* --- NEW: Renew Loan Modal --- */}
            {showRenewModal && (
                <RenewLoanModal 
                    loan={loanDetails}
                    outstandingInterest={calculatedInterest}
                    onClose={() => setShowRenewModal(false)} 
                    onRenewalSuccess={(newLoanId) => {
                        setShowRenewModal(false);
                        navigate(`/loans/${newLoanId}`); // Auto-redirect to new loan
                    }} 
                />
            )}

            {/* Hidden Print Component */}
            <div style={hiddenPrintComponentStyle}>
                {loanDetails && <PrintableInvoice ref={invoiceRef} loanDetails={loanDetails} />}
            </div>
        </div>
    );
}

export default LoanPage;