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
import RenewLoanModal from '../components/RenewLoanModal';

const API_URL = process.env.REACT_APP_API_URL; 

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
    position: 'fixed', top: 0, left: 0, width: '210mm', minHeight: '297mm',
    zIndex: -1000, opacity: 0, pointerEvents: 'none', backgroundColor: 'white'
};

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

function LoanPage({ userRole }) {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loanData, setLoanData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [discount, setDiscount] = useState('');
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false); 
    const [showRenewModal, setShowRenewModal] = useState(false);
    const [additionalAmount, setAdditionalAmount] = useState('');
    const [calculatedInterest, setCalculatedInterest] = useState(0);
    const [calculatedMonths, setCalculatedMonths] = useState(0);
    const [calculatedTotalOwed, setCalculatedTotalOwed] = useState(0);
    const [calculatedRate, setCalculatedRate] = useState(0);
    const [disbursementDetails, setDisbursementDetails] = useState([]); 

    const invoiceRef = useRef();
    const handleReactPrint = useReactToPrint({ content: () => invoiceRef.current, documentTitle: `Loan-Invoice-${id}`, onAfterPrint: () => setShowPrintModal(false) });
    
    const handleSavePdf = async () => { 
        if (!invoiceRef.current) return alert("PDF Error: Invoice Reference missing.");
        const originalElement = invoiceRef.current;
        const clone = originalElement.cloneNode(true);
        const container = document.createElement('div');
        container.style.position = 'fixed'; container.style.top = '-10000px'; container.style.left = '0'; container.style.zIndex = '-1000';
        container.appendChild(clone);
        document.body.appendChild(container);
        try {
            const canvas = await html2canvas(clone, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff', windowWidth: 1200 });
            const imgData = canvas.toDataURL('image/png'); 
            const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' }); 
            pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
            pdf.save(`Loan-Invoice-${id}.pdf`); 
            document.body.removeChild(container);
            setShowPrintModal(false);
        } catch (err) { 
            console.error("PDF Generation Error:", err); alert("PDF Generation Failed."); 
            if (document.body.contains(container)) document.body.removeChild(container);
        }
    };
    
    const handleSettleAndClose = async () => { 
        const discountValue = parseFloat(discount) || 0;
        if (window.confirm(`Settle this loan with a discount of ₹${discountValue.toFixed(2)}?`)) {
            try { 
                const response = await axios.post(`${API_URL}/api/loans/${id}/settle`, { discountAmount: discountValue, settlementAmount: currentBalance - discountValue }); 
                alert(response.data.message); 
                setRefreshTrigger(t => t + 1); 
            } catch (err) { 
                alert(err.response?.data?.error || 'Settle failed.'); 
            } 
        }
    };
    
    const handleAddPrincipal = async () => { 
        const amountValue = parseFloat(additionalAmount);
        if (!amountValue || amountValue <= 0) return alert('Please enter a valid positive amount.');
        if (window.confirm(`Add ₹${amountValue.toFixed(2)} to principal?`)) {
            try { 
                const response = await axios.post(`${API_URL}/api/loans/${id}/add-principal`, { additionalAmount: amountValue }); 
                alert(response.data.message); 
                setAdditionalAmount(''); 
                setRefreshTrigger(t => t + 1); 
            } catch (err) { 
                alert(err.response?.data?.error || 'Add principal failed.'); 
            } 
        }
    };
    
    const handleDeleteLoan = async () => { 
      if (window.confirm("Are you sure? This will move the loan to the recycle bin.")) {
        try {
          const response = await axios.delete(`${API_URL}/api/loans/${id}`);
          alert(response.data.message);
          navigate(`/customers/${loanData.loanDetails.customer_id}`);
        } catch (err) {
          alert(err.response?.data?.error || "Failed to delete loan.");
        }
      }
    };

    useEffect(() => {
        const fetchLoanData = async () => {
            setIsLoading(true);
            try {
                const response = await axios.get(`${API_URL}/api/loans/${id}`);
                setLoanData(response.data);
                if (response.data?.loanDetails) {
                    const stats = calculateInterestDetails(response.data.loanDetails, response.data.transactions);
                    setCalculatedInterest(stats.totalInterest);
                    setCalculatedMonths(stats.totalMonthsFactor);
                    setCalculatedRate(stats.rateUsed);
                    setCalculatedTotalOwed(stats.totalOwed);
                    setDisbursementDetails(stats.disbursementEvents); 
                }
            } catch (err) { setError("Loan not found."); } finally { setIsLoading(false); }
        };
        fetchLoanData();
    }, [id, refreshTrigger]);

    if (isLoading) return <div className="text-center mt-5"><div className="spinner-border text-primary"></div></div>;
    if (error) return <div className="alert alert-danger m-4">{error}</div>;
    if (!loanData?.loanDetails) return <div className="alert alert-warning">Loan data missing.</div>;

    const { loanDetails, transactions } = loanData;
    
    // --- FIX: Separate Discount from Cash Payments ---
    const paymentsReceived = transactions?.filter(tx => tx.payment_type !== 'disbursement' && tx.payment_type !== 'discount') || [];
    const disbursementsMade = transactions?.filter(tx => tx.payment_type === 'disbursement') || [];
    const totalPaid = paymentsReceived.reduce((sum, tx) => sum + parseFloat(tx.amount_paid || 0), 0);
    const currentBalance = calculatedTotalOwed - totalPaid;

    const formatCurrency = (amount) => `₹${parseFloat(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const formatDate = (date) => new Date(date).toLocaleDateString('en-IN'); 
    const isDeletable = loanDetails.status === 'paid' || loanDetails.status === 'forfeited' || loanDetails.status === 'renewed';

    // --- NEW: Settlement Summary Helper ---
    const _buildSettlementSummary = () => {
        if (loanDetails.status !== 'paid') return null;

        const allTxs = transactions || [];
        const disbTxs = allTxs.filter(t => t.payment_type === 'disbursement');
        const payTxs = allTxs.filter(t => ['interest', 'principal', 'settlement'].includes(t.payment_type));
        const discountTxs = allTxs.filter(t => t.payment_type === 'discount');

        const totalPrincipal = disbTxs.reduce((sum, t) => sum + parseFloat(t.amount_paid), 0);
        const totalCashPaid = payTxs.reduce((sum, t) => sum + parseFloat(t.amount_paid), 0);
        const totalDiscount = discountTxs.reduce((sum, t) => sum + parseFloat(t.amount_paid), 0);
        
        // Derived Interest = (Cash + Discount) - Principal
        const totalInterestGenerated = (totalCashPaid + totalDiscount) - totalPrincipal;

        return (
            <div className="card shadow-sm mb-4 border-success">
                <div className="card-header bg-success text-white">
                    <i className="bi bi-check-circle-fill me-2"></i>
                    Settlement Summary (Closed)
                </div>
                <div className="card-body">
                    <table className="table table-borderless table-sm mb-0">
                        <tbody>
                            <tr>
                                <td>Total Principal Disbursed</td>
                                <td className="text-end">{formatCurrency(totalPrincipal)}</td>
                            </tr>
                            <tr>
                                <td>+ Interest & Charges</td>
                                <td className="text-end">{formatCurrency(totalInterestGenerated)}</td>
                            </tr>
                            <tr className="border-top">
                                <td className="fw-bold">Total Payable Amount</td>
                                <td className="text-end fw-bold">{formatCurrency(totalPrincipal + totalInterestGenerated)}</td>
                            </tr>
                            <tr>
                                <td className="text-success">- Total Cash Paid</td>
                                <td className="text-end text-success">-{formatCurrency(totalCashPaid)}</td>
                            </tr>
                            {totalDiscount > 0 && (
                                <tr>
                                    <td className="text-danger">- Discount / Waiver</td>
                                    <td className="text-end text-danger">-{formatCurrency(totalDiscount)}</td>
                                </tr>
                            )}
                            <tr className="border-top border-2">
                                <td className="fw-bold">Outstanding Balance</td>
                                <td className="text-end fw-bold">₹0.00</td>
                            </tr>
                        </tbody>
                    </table>
                    <div className="text-center mt-3 small text-muted">
                        <i className="bi bi-calendar-check me-1"></i>
                        Loan settled on {loanDetails.closed_date ? formatDate(loanDetails.closed_date) : 'N/A'}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="container-fluid pt-3">
            <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
                <h2>Loan Details (ID: {loanDetails.id})</h2>
                <div>
                    <button className="btn btn-outline-secondary btn-sm me-2" onClick={() => setShowHistoryModal(true)}>View History</button>
                    {(loanDetails.status === 'active' || loanDetails.status === 'overdue') && (
                        <button className="btn btn-success btn-sm me-2" onClick={() => setShowRenewModal(true)}><i className="bi bi-arrow-repeat me-1"></i> Renew</button>
                    )}
                    <Link to={`/loans/${id}/edit`} className="btn btn-warning btn-sm me-2">Edit Loan</Link>
                    <button className="btn btn-info btn-sm" onClick={() => setShowPrintModal(true)}>Print / Save Invoice</button>
                    {userRole === 'admin' && isDeletable && (
                        <button className="btn btn-danger btn-sm ms-2" onClick={handleDeleteLoan}><i className="bi bi-trash"></i></button>
                    )}
                </div>
            </div>

            <div className="row g-4"> 
                <div className="col-lg-8">
                    {/* Customer Info */}
                    <div className="card shadow-sm mb-4">
                        <div className="card-header">Customer Information</div>
                        <div className="card-body d-flex align-items-center">
                            <div>
                                <h5><Link to={`/customers/${loanDetails.customer_id}`}>{loanDetails.customer_name}</Link></h5>
                                <p className="mb-0 text-muted"><i className="bi bi-telephone me-1"></i> {loanDetails.phone_number}</p>
                                <p className="mb-0 text-muted small mt-1"><i className="bi bi-geo-alt me-1"></i> {loanDetails.address ? loanDetails.address : <span className="fst-italic">No address on file</span>}</p>
                            </div>
                        </div>
                    </div>

                    {/* Loan Summary */}
                    <div className="card shadow-sm mb-4">
                        <div className="card-header">Loan Summary</div>
                        <div className="card-body">
                            <div className="row">
                                <div className="col-md-6 mb-2"><strong>Book Loan #:</strong> {loanDetails.book_loan_number}</div>
                                <div className="col-md-6 mb-2"><strong>Status:</strong> <span className={`badge bg-${loanDetails.status === 'overdue' ? 'danger' : loanDetails.status === 'paid' ? 'secondary' : loanDetails.status === 'renewed' ? 'info text-dark' : 'success'} ms-2`}>{loanDetails.status.toUpperCase()}</span></div>
                                <div className="col-md-6 mb-2"><strong>Principal:</strong> {formatCurrency(loanDetails.principal_amount)}</div>
                                <div className="col-md-6 mb-2"><strong>Rate:</strong> {loanDetails.interest_rate}% p.m.</div>
                                <div className="col-md-6 mb-2"><strong>Pledge Date:</strong> {formatDate(loanDetails.pledge_date)}</div>
                                <div className="col-md-6 mb-2"><strong>Due Date:</strong> {formatDate(loanDetails.due_date)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Pledged Item */}
                    <div className="card shadow-sm mb-4">
                        <div className="card-header">Pledged Item Details</div>
                        <div className="card-body">
                            <div className="d-flex align-items-start">
                                {loanDetails.item_image_data_url && (
                                    <img src={loanDetails.item_image_data_url} alt="Item" className="rounded border p-1 me-3" style={{ width: '100px', height: '100px', objectFit: 'cover' }} />
                                )}
                                <div className="flex-grow-1">
                                    <h5 className="card-title mb-1">{loanDetails.description}</h5>
                                    <span className="badge bg-info text-dark mb-3">{loanDetails.item_type?.toUpperCase()}</span>
                                    <div className="row g-2 small">
                                        <div className="col-6"><div className="text-muted">Gross Weight:</div><div className="fw-bold">{loanDetails.gross_weight || loanDetails.weight || '0'} g</div></div>
                                        <div className="col-6"><div className="text-muted">Net Weight:</div><div className="fw-bold">{loanDetails.net_weight || '0'} g</div></div>
                                        <div className="col-6"><div className="text-muted">Purity:</div><div className="fw-bold">{loanDetails.purity || 'N/A'}</div></div>
                                        <div className="col-6"><div className="text-muted">Appraised Value:</div><div className="fw-bold">{formatCurrency(loanDetails.appraised_value)}</div></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Amount Due (Only Active) */}
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

                    {/* Interest Breakdown (Only Active) */}
                    {(loanDetails.status === 'active' || loanDetails.status === 'overdue') && disbursementDetails.length > 0 && (
                        <div className="card shadow-sm mb-4 border-info">
                            <div className="card-header bg-info text-dark">Detailed Interest Breakdown</div>
                            <div className="card-body">
                                <table className="table table-sm table-bordered small mb-0">
                                    <thead className='table-light'>
                                        <tr><th>Source / Date</th><th className='text-end'>Amount</th><th className='text-end'>Factor</th><th className='text-end'>Interest</th></tr>
                                    </thead>
                                    <tbody>
                                        {disbursementDetails.map((event, index) => (
                                            <tr key={index}>
                                                <td><strong>{event.label}</strong><small className='d-block text-muted'>{formatDate(event.date)}</small></td>
                                                <td className='text-end'>{formatCurrency(event.amount)}</td>
                                                <td className='text-end'>{event.monthsFactor.toFixed(1)}</td>
                                                <td className='text-end'>{formatCurrency(event.accruedInterest)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="table-secondary"><td colSpan="3" className='text-end fw-bold'>TOTAL INTEREST</td><td className='text-end fw-bold'>{formatCurrency(calculatedInterest)}</td></tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    )}
                </div> 

                {/* Right Column: Actions */}
                <div className="col-lg-4">
                    {(loanDetails.status === 'active' || loanDetails.status === 'overdue') && ( 
                        <div className="card border-info shadow-sm mb-4"> 
                            <div className="card-header bg-info text-dark">Disburse More Principal</div> 
                            <div className="card-body"> 
                                <div className="d-flex"> 
                                    <input type="number" step="0.01" className="form-control form-control-sm me-2" value={additionalAmount} onChange={e => setAdditionalAmount(e.target.value)} placeholder="Amount (₹)"/> 
                                    <button onClick={handleAddPrincipal} className="btn btn-primary btn-sm">Disburse</button> 
                                </div> 
                            </div> 
                        </div> 
                    )}
                    
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
                                </div> 
                            </div> 
                        </div> 
                    )}
                    
                    <div className="card shadow-sm mb-4">
                        <div className="card-header">Transaction History</div>
                        <div className="card-body">
                            <div className="row">
                                <div className="col-6 border-end pe-2">
                                    <h6>Payments</h6>
                                    {paymentsReceived.length > 0 ? (
                                        <ul className="list-unstyled small mb-0">
                                            {paymentsReceived.map(tx => (
                                                <li key={tx.id} className="mb-2">
                                                    <div>{formatDate(tx.payment_date)}: <strong>{formatCurrency(tx.amount_paid)}</strong> ({tx.payment_type})</div>
                                                    {tx.changed_by_username && <small className="text-muted">by: {tx.changed_by_username}</small>}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : <p className="text-muted small mb-0">No payments.</p>}
                                </div>
                                <div className="col-6 ps-2">
                                    <h6>Disbursements</h6>
                                    {disbursementsMade.length > 0 ? (
                                        <ul className="list-unstyled small mb-0">
                                            {disbursementsMade.map(tx => (
                                                <li key={tx.id} className="mb-2">
                                                    <div>{formatDate(tx.payment_date)}: <strong>{formatCurrency(tx.amount_paid)}</strong></div>
                                                    {tx.changed_by_username && <small className="text-muted">by: {tx.changed_by_username}</small>}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : <p className="text-muted small mb-0">None.</p>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- NEW: Settlement Summary (Only Paid) --- */}
                    {_buildSettlementSummary()}

                </div> 
            </div> 

            <div className="mt-3"><Link to={`/customers/${loanDetails.customer_id}`} className="btn btn-secondary btn-sm">Back to Customer</Link></div>

            {showPrintModal && (
                <div style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        <div style={modalHeaderStyle}>
                            <h5 className="modal-title">Invoice Preview</h5>
                            <button type="button" className="btn-close" onClick={() => setShowPrintModal(false)}></button>
                        </div>
                        <div style={modalBodyStyle}>
                            <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                                <div style={{ border: '1px solid #ddd', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', padding: '10px' }}>
                                    {loanDetails && <PrintableInvoice loanDetails={loanDetails} />}
                                </div>
                            </div>
                        </div>
                        <div style={modalFooterStyle}>
                            <button type="button" className="btn btn-secondary me-2" onClick={() => setShowPrintModal(false)}>Close</button>
                            <button type="button" className="btn btn-success me-2" onClick={handleSavePdf}>Save as PDF</button>
                            <button type="button" className="btn btn-primary" onClick={handleReactPrint}>Print</button>
                        </div>
                    </div>
                </div>
            )}

            {showHistoryModal && <LoanHistoryModal loanId={id} onClose={() => setShowHistoryModal(false)} />}
            
            {showRenewModal && (
                <RenewLoanModal 
                    loan={loanDetails}
                    outstandingInterest={calculatedInterest} 
                    onClose={() => setShowRenewModal(false)} 
                    onRenewalSuccess={(newLoanId) => {
                        setShowRenewModal(false);
                        navigate(`/loans/${newLoanId}`); 
                    }} 
                />
            )}

            <div style={hiddenPrintComponentStyle}>
                {loanDetails && <PrintableInvoice ref={invoiceRef} loanDetails={loanDetails} />}
            </div>
        </div>
    );
}

export default LoanPage;