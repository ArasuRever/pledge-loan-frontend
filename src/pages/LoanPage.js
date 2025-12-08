import React, { useState, useEffect, useRef, useMemo } from 'react';
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

// --- Styles ---
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1050 };
const hiddenPrintComponentStyle = { position: 'fixed', top: 0, left: 0, width: '210mm', minHeight: '297mm', zIndex: -1000, opacity: 0, pointerEvents: 'none', backgroundColor: 'white' };

function LoanPage({ userRole }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loanData, setLoanData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Action States
  const [settleAmount, setSettleAmount] = useState('');
  const [settleDiscount, setSettleDiscount] = useState('');
  const [additionalAmount, setAdditionalAmount] = useState('');
  
  // Modals & Triggers
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);

  // Calculated Data
  const [calculatedStats, setCalculatedStats] = useState(null);
  const [interestBreakdown, setInterestBreakdown] = useState([]);

  const invoiceRef = useRef();

  // --- Print & PDF Logic ---
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

  // --- Financial Logic ---
  const getLiveBalance = () => {
    if (calculatedStats?.amountDue) return parseFloat(calculatedStats.amountDue);
    return 0;
  };

  const handleSettleAmountInput = (val) => {
    setSettleAmount(val);
    const balance = getLiveBalance();
    const pay = parseFloat(val) || 0;
    const disc = Math.max(0, balance - pay);
    if (val === '') setSettleDiscount(''); else setSettleDiscount(disc.toFixed(2));
  };

  const handleDiscountInput = (val) => {
    setSettleDiscount(val);
    const balance = getLiveBalance();
    const disc = parseFloat(val) || 0;
    const pay = Math.max(0, balance - disc);
    if (val === '') setSettleAmount(''); else setSettleAmount(pay.toFixed(2));
  };

  // --- API Actions ---
  const handleSettleAndClose = async () => {
    const payAmount = parseFloat(settleAmount) || 0;
    const discAmount = parseFloat(settleDiscount) || 0;
    const currentBalance = getLiveBalance();
    const remaining = currentBalance - (payAmount + discAmount);

    if (remaining > 0.5) {
      alert(`Insufficient Settlement.\n\nOutstanding: ${formatCurrency(currentBalance)}\nPayment + Discount: ${formatCurrency(payAmount + discAmount)}\nStill Due: ${formatCurrency(remaining)}`);
      return;
    }

    if (window.confirm(`Confirm Settlement?\n\nCash Payment: ${formatCurrency(payAmount)}\nDiscount: ${formatCurrency(discAmount)}\n\nThis will CLOSE the loan.`)) {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API_URL}/api/loans/${id}/settle`, { settlementAmount: payAmount, discountAmount: discAmount }, { headers: { Authorization: `Bearer ${token}` } });
        alert(response.data.message);
        setSettleAmount('');
        setSettleDiscount('');
        setRefreshTrigger(t => t + 1);
      } catch (err) { alert(err.response?.data?.error || 'Settle failed.'); }
    }
  };

  const handleAddPrincipal = async () => {
    const amountValue = parseFloat(additionalAmount);
    if (!amountValue || amountValue <= 0) return alert('Please enter a valid positive amount.');
    if (window.confirm(`Add ₹${amountValue.toFixed(2)} to principal?`)) {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API_URL}/api/loans/${id}/add-principal`, { additionalAmount: amountValue }, { headers: { Authorization: `Bearer ${token}` } });
        alert(response.data.message);
        setAdditionalAmount('');
        setRefreshTrigger(t => t + 1);
      } catch (err) { alert(err.response?.data?.error || 'Add principal failed.'); }
    }
  };

  const handleDeleteLoan = async () => {
    if (window.confirm("Are you sure? This will move the loan to the recycle bin.")) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/api/loans/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        alert("Loan moved to Recycle Bin.");
        navigate(`/customers/${loanData.loanDetails.customer_id}`);
      } catch (err) { alert(err.response?.data?.error || "Failed to delete loan."); }
    }
  };

  // --- Effects ---
  useEffect(() => {
    const fetchLoanData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/api/loans/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        setLoanData(response.data);
        if (response.data.calculated) {
          setCalculatedStats(response.data.calculated);
          setInterestBreakdown(response.data.interestBreakdown || []);
        }
      } catch (err) { setError("Loan not found."); } finally { setIsLoading(false); }
    };
    fetchLoanData();
  }, [id, refreshTrigger]);

  // --- Data Extraction & Helpers ---
  const { loanDetails, transactions } = loanData || {};
  const formatCurrency = (amount) => `₹${parseFloat(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return 'Invalid Date';
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) { return 'Error'; }
  };
  
  const formatDateTime = (date) => { try { return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour:'2-digit', minute:'2-digit' }); } catch (e) { return 'N/A'; } };
  
  const getImageUrl = (url) => {
    if (!url) return null;
    if (typeof url === 'object') return null; 
    if (url.startsWith('data:') || url.startsWith('http')) return url;
    return `${API_URL}${url}`;
  };

  const getStatusBadge = (status) => {
    switch(status) {
        case 'active': return <span className="badge bg-success bg-opacity-10 text-success border border-success px-3 py-2 rounded-pill">ACTIVE</span>;
        case 'overdue': return <span className="badge bg-danger bg-opacity-10 text-danger border border-danger px-3 py-2 rounded-pill">OVERDUE</span>;
        case 'paid': return <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary px-3 py-2 rounded-pill">CLOSED</span>;
        default: return <span className="badge bg-light text-dark border px-3 py-2 rounded-pill">{status?.toUpperCase()}</span>;
    }
  };

  // --- Logic: Previous Balance for Disbursements ---
  const enrichedDisbursements = useMemo(() => {
    if (!transactions) return [];
    
    const chronoTxs = [...transactions].sort((a,b) => new Date(a.payment_date) - new Date(b.payment_date));
    let runningPrincipal = 0;
    
    // Attempt to infer base principal start point
    const disbs = transactions.filter(t => t.payment_type === 'disbursement');
    const topUpTotal = disbs.reduce((sum, t) => sum + parseFloat(t.amount_paid), 0);
    const initialPrincipal = (parseFloat(loanDetails?.principal_amount || 0) - topUpTotal);
    
    runningPrincipal = initialPrincipal; 

    const enriched = [];
    chronoTxs.forEach(tx => {
        const amt = parseFloat(tx.amount_paid);
        if (tx.payment_type === 'disbursement') {
            enriched.push({ ...tx, prevBalance: runningPrincipal });
            runningPrincipal += amt;
        } else if (tx.payment_type === 'principal') {
            runningPrincipal -= amt;
        }
    });
    
    return enriched.sort((a,b) => new Date(b.payment_date) - new Date(a.payment_date));
  }, [transactions, loanDetails]);

  // FIX: Include 'discount' in payments history list
  const paymentsReceived = transactions?.filter(tx => tx.payment_type !== 'disbursement') || [];
  const discountGiven = transactions?.filter(tx => tx.payment_type === 'discount').reduce((sum, tx) => sum + parseFloat(tx.amount_paid), 0) || 0;

  // --- Loading/Error States ---
  if (isLoading) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary" style={{width: '3rem', height: '3rem'}}></div></div>;
  if (error) return <div className="alert alert-danger m-5 text-center shadow-sm">{error}</div>;
  if (!loanData?.loanDetails) return <div className="alert alert-warning m-5">Loan data missing.</div>;

  return (
    <div className="container-fluid bg-light min-vh-100 py-4 px-lg-5">
      
      {/* --- HEADER --- */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
        <div>
            <nav aria-label="breadcrumb">
                <ol className="breadcrumb mb-1 small">
                    <li className="breadcrumb-item"><Link to="/customers" className="text-decoration-none text-muted">Customers</Link></li>
                    <li className="breadcrumb-item"><Link to={`/customers/${loanDetails.customer_id}`} className="text-decoration-none text-muted">{loanDetails.customer_name}</Link></li>
                    <li className="breadcrumb-item active" aria-current="page">Loan #{loanDetails.book_loan_number}</li>
                </ol>
            </nav>
            <div className="d-flex align-items-center gap-3">
                <h2 className="fw-bold mb-0 text-dark">Loan Details</h2>
                {getStatusBadge(loanDetails.status)}
            </div>
        </div>
        
        <div className="d-flex flex-wrap gap-2 mt-3 mt-md-0">
            <button className="btn btn-white bg-white border border-secondary-subtle shadow-sm text-muted" onClick={() => setShowHistoryModal(true)}>
                <i className="bi bi-clock-history me-1"></i> Full History
            </button>
            <button className="btn btn-white bg-white border border-secondary-subtle shadow-sm text-primary" onClick={() => setShowPrintModal(true)}>
                <i className="bi bi-printer me-1"></i> Invoice
            </button>
            {(loanDetails.status === 'active' || loanDetails.status === 'overdue') && (
                <button className="btn btn-success text-white shadow-sm" onClick={() => setShowRenewModal(true)}>
                    <i className="bi bi-arrow-repeat me-1"></i> Renew
                </button>
            )}
            <Link to={`/loans/${id}/edit`} className="btn btn-warning text-dark shadow-sm">
                <i className="bi bi-pencil me-1"></i> Edit
            </Link>
            {userRole === 'admin' && (
                <button className="btn btn-outline-danger shadow-sm d-flex align-items-center" onClick={handleDeleteLoan}>
                    <i className="bi bi-trash me-1"></i> Delete
                </button>
            )}
        </div>
      </div>

      {/* --- KEY METRICS --- */}
      <div className="row g-2 mb-4">
        <div className="col">
            <div className="card border border-secondary-subtle shadow-sm h-100">
                <div className="card-body p-2 border-start border-4 border-primary rounded-start">
                    <div className="text-muted small text-uppercase fw-bold mb-1" style={{fontSize: '0.7rem'}}>Principal</div>
                    <div className="fs-5 fw-bold text-dark">{formatCurrency(loanDetails.principal_amount)}</div>
                </div>
            </div>
        </div>
        <div className="col">
            <div className="card border border-secondary-subtle shadow-sm h-100">
                <div className="card-body p-2 border-start border-4 border-info rounded-start">
                    <div className="text-muted small text-uppercase fw-bold mb-1" style={{fontSize: '0.7rem'}}>Rate</div>
                    <div className="fs-5 fw-bold text-dark">{loanDetails.interest_rate}%</div>
                </div>
            </div>
        </div>
        <div className="col">
            <div className="card border border-secondary-subtle shadow-sm h-100">
                <div className="card-body p-2 border-start border-4 border-secondary rounded-start">
                    <div className="text-muted small text-uppercase fw-bold mb-1" style={{fontSize: '0.7rem'}}>Pledged Date</div>
                    <div className="fs-5 fw-bold text-dark">{formatDate(loanDetails.pledge_date)}</div>
                </div>
            </div>
        </div>
        <div className="col">
            <div className="card border border-secondary-subtle shadow-sm h-100">
                <div className="card-body p-2 border-start border-4 border-warning rounded-start">
                    <div className="text-muted small text-uppercase fw-bold mb-1" style={{fontSize: '0.7rem'}}>Due Date</div>
                    <div className="fs-5 fw-bold text-dark">{formatDate(loanDetails.due_date)}</div>
                </div>
            </div>
        </div>
        <div className="col">
            <div className="card border border-secondary-subtle shadow-sm h-100 bg-white">
                <div className={`card-body p-2 border-start border-4 rounded-start ${loanDetails.status === 'paid' ? 'border-success' : 'border-danger'}`}>
                    <div className="text-muted small text-uppercase fw-bold mb-1" style={{fontSize: '0.7rem'}}>Outstanding</div>
                    <div className={`fs-5 fw-bold ${loanDetails.status === 'paid' ? 'text-success' : 'text-danger'}`}>
                        {loanDetails.status === 'paid' ? 'Settled' : formatCurrency(calculatedStats?.amountDue)}
                    </div>
                </div>
            </div>
        </div>
      </div>

      <div className="row g-4">
        {/* --- LEFT COLUMN --- */}
        <div className="col-lg-8">
            
            {/* Customer Details */}
            <div className="card border border-secondary-subtle shadow-sm mb-3">
                <div className="card-header bg-white py-2 border-bottom">
                    <h6 className="mb-0 fw-bold text-gray-800">Customer Details</h6>
                </div>
                <div className="card-body p-4">
                    <div className="d-flex flex-column flex-sm-row gap-4 align-items-start">
                        <div className="flex-shrink-0">
                             {getImageUrl(loanDetails.customer_image_url) ? (
                                <img src={getImageUrl(loanDetails.customer_image_url)} alt="Customer" className="rounded-circle border shadow-sm object-fit-cover" style={{ width: '100px', height: '100px' }} />
                             ) : (
                                <div className="bg-light rounded-circle d-flex align-items-center justify-content-center text-muted border" style={{ width: '100px', height: '100px' }}><i className="bi bi-person-fill fs-1"></i></div>
                             )}
                        </div>
                        <div className="flex-grow-1 w-100">
                            <div className="d-flex justify-content-between border-bottom pb-2 mb-2">
                                <span className="text-secondary fw-medium">Customer Name:</span>
                                <span className="fw-bold text-dark"><Link to={`/customers/${loanDetails.customer_id}`} className="text-decoration-none text-dark">{loanDetails.customer_name}</Link></span>
                            </div>
                            <div className="d-flex justify-content-between border-bottom pb-2 mb-2">
                                <span className="text-secondary fw-medium">Phone Number:</span>
                                <span className="text-dark fw-medium">{loanDetails.phone_number}</span>
                            </div>
                            <div className="d-flex justify-content-between align-items-start">
                                <span className="text-secondary fw-medium">Address:</span>
                                <span className="text-dark text-end" style={{maxWidth: '60%'}}>{loanDetails.address || <span className="text-muted fst-italic">No address provided</span>}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pledged Item */}
            <div className="card border border-secondary-subtle shadow-sm mb-4">
                <div className="card-header bg-white py-2 border-bottom">
                    <h6 className="mb-0 fw-bold text-gray-800">Pledged Item Details</h6>
                </div>
                <div className="card-body p-4">
                    <div className="d-flex flex-column flex-sm-row gap-4 mb-4 border-bottom pb-3">
                        <div className="flex-shrink-0">
                             {getImageUrl(loanDetails.item_image_data_url) ? (
                                <img src={getImageUrl(loanDetails.item_image_data_url)} alt="Item" className="rounded border shadow-sm object-fit-cover" style={{ width: '100px', height: '100px' }} />
                             ) : (
                                <div className="bg-light rounded d-flex align-items-center justify-content-center text-muted border" style={{ width: '100px', height: '100px' }}><i className="bi bi-image fs-1"></i></div>
                             )}
                        </div>
                        <div className="flex-grow-1">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                                <h5 className="fw-bold mb-0 text-dark">{loanDetails.description}</h5>
                                <span className="badge bg-secondary">{loanDetails.item_type?.toUpperCase()}</span>
                            </div>
                            <div className="d-flex flex-wrap gap-3 text-muted small mt-2">
                                <div className="bg-light px-2 py-1 rounded border">Gross: <strong className="text-dark">{loanDetails.gross_weight || loanDetails.weight || '0'}g</strong></div>
                                <div className="bg-light px-2 py-1 rounded border">Net: <strong className="text-dark">{loanDetails.net_weight || '0'}g</strong></div>
                                <div className="bg-light px-2 py-1 rounded border">Purity: <strong className="text-dark">{loanDetails.purity || '-'}</strong></div>
                            </div>
                        </div>
                    </div>
                    <div className="row g-3">
                        <div className="col-md-4"><div className="p-2 border rounded bg-light h-100"><small className="text-muted d-block mb-1">Book Loan Number</small><span className="fw-bold text-primary fs-5">#{loanDetails.book_loan_number}</span></div></div>
                        <div className="col-md-4"><div className="p-2 border rounded bg-light h-100"><small className="text-muted d-block mb-1">Appraised Value</small><span className="fw-bold text-success fs-5">{formatCurrency(loanDetails.appraised_value)}</span></div></div>
                        <div className="col-md-4"><div className="p-2 border rounded bg-light h-100"><small className="text-muted d-block mb-1">Quality/Remarks</small><span className="text-dark fst-italic">{loanDetails.remarks || loanDetails.quality || 'N/A'}</span></div></div>
                    </div>
                </div>
            </div>

            {/* Financial Worksheet */}
            {calculatedStats && (
            <div className="card border border-secondary-subtle shadow-sm mb-4">
                <div className="card-header bg-white border-bottom py-2 d-flex justify-content-between align-items-center">
                    <h6 className="mb-0 fw-bold text-primary"><i className="bi bi-calculator me-2"></i>Financial Worksheet</h6>
                    {loanDetails.status === 'paid' && <span className="badge bg-success">LOAN SETTLED</span>}
                </div>
                <div className="card-body p-0">
                    <div className="row g-0">
                        {/* Summary Sidebar */}
                        <div className="col-md-4 bg-light p-3 border-end">
                            <div className="small text-muted fw-bold mb-2">Principal</div>
                            <div className="d-flex justify-content-between mb-1 small"><span>Disbursed</span><span className="fw-bold">{formatCurrency(loanDetails.principal_amount)}</span></div>
                            <div className="d-flex justify-content-between mb-3 small text-success"><span>Paid Back</span><span>- {formatCurrency(calculatedStats.principalPaid)}</span></div>
                            <div className="p-2 bg-white rounded border mb-3 text-center"><small className="text-muted d-block" style={{fontSize: '0.7rem'}}>Current Principal</small><span className="fw-bold text-primary">{formatCurrency(calculatedStats.outstandingPrincipal)}</span></div>
                            <div className="small text-muted fw-bold mb-2">Interest</div>
                            <div className="d-flex justify-content-between mb-1 small"><span>Accrued</span><span className="fw-bold">{formatCurrency(calculatedStats.totalInterestOwed)}</span></div>
                            <div className="d-flex justify-content-between mb-1 small text-success"><span>Paid</span><span>- {formatCurrency(calculatedStats.interestPaid)}</span></div>
                            {discountGiven > 0 && (<div className="d-flex justify-content-between mb-1 small text-danger"><span>Waived</span><span>- {formatCurrency(discountGiven)}</span></div>)}
                             <div className="border-top my-2"></div>
                             <div className="d-flex justify-content-between align-items-center small"><span className="fw-bold">Net Interest</span><span className="fw-bold text-danger">{formatCurrency(parseFloat(calculatedStats.amountDue) - parseFloat(calculatedStats.outstandingPrincipal))}</span></div>
                        </div>

                        {/* Detailed Table (Sequential Order) */}
                        <div className="col-md-8 p-3">
                            <div className="table-responsive">
                                <table className="table table-hover small mb-0 align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Period</th>
                                            <th className="text-end">Bal</th>
                                            <th className="text-end">Mos</th>
                                            <th className="text-end">Amt</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[...interestBreakdown].reverse().map((item, idx) => {
                                            const isPayment = item.status === 'payment';
                                            return (
                                                <tr key={idx} className={isPayment ? 'table-success bg-opacity-10' : ''}>
                                                    <td>
                                                        <div className={`fw-bold ${isPayment ? 'text-success' : ''}`} style={{fontSize: '0.75rem'}}>{item.label}</div>
                                                        <div className="text-muted" style={{fontSize: '0.65rem'}}>{formatDate(item.date)} {item.endDate ? `- ${formatDate(item.endDate)}` : ''}</div>
                                                    </td>
                                                    <td className={`text-end ${isPayment ? 'text-muted' : ''}`}>
                                                        {isPayment ? '-' : formatCurrency(item.amount)}
                                                    </td>
                                                    <td className="text-end">
                                                        {item.months ? parseFloat(item.months).toFixed(2) : '-'}
                                                    </td>
                                                    <td className={`text-end fw-bold ${isPayment ? 'text-success' : ''}`}>
                                                        {isPayment ? formatCurrency(item.amount) : formatCurrency(item.interest)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            {loanDetails.status !== 'paid' && (
                                <div className="alert alert-primary d-flex align-items-center justify-content-between mt-3 mb-0 p-2">
                                    <div className="small"><strong>Total Payable</strong></div>
                                    <div className="fs-5 fw-bold">{formatCurrency(calculatedStats.amountDue)}</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            )}

            {/* --- Principal & Interest Breakdown Card --- */}
            {calculatedStats && (
            <div className="card border border-primary shadow-sm mb-4">
                <div className="card-header bg-primary text-white py-2 border-bottom">
                    <h6 className="mb-0 fw-bold"><i className="bi bi-list-columns-reverse me-2"></i>Principal & Interest Breakdown</h6>
                </div>
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover mb-0 align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th className="ps-3">Description / Type</th>
                                    <th>Period</th>
                                    <th className="text-end">Principal</th>
                                    <th className="text-end pe-3">Interest</th>
                                </tr>
                            </thead>
                            <tbody>
                                {interestBreakdown.filter(item => item.status === 'accrued').map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="ps-3">
                                            <div className="fw-bold text-dark small">{item.label}</div>
                                        </td>
                                        <td className="text-muted small">
                                            {formatDate(item.date)} - {formatDate(item.endDate)}
                                            <span className="badge bg-light text-dark border ms-2">{parseFloat(item.months).toFixed(2)} mos</span>
                                        </td>
                                        <td className="text-end small fw-medium">{formatCurrency(item.amount)}</td>
                                        <td className="text-end small fw-bold text-primary pe-3">{formatCurrency(item.interest)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            )}
            
            {/* Settlement Summary */}
            {loanDetails.status === 'paid' && (
                <div className="card border border-success shadow-sm mb-4">
                    <div className="card-header bg-success text-white py-2"><i className="bi bi-check-circle-fill me-2"></i>Loan Closed</div>
                    <div className="card-body p-3">
                         <div className="row text-center small">
                             <div className="col-4 border-end"><span className="text-muted d-block">Settled Date</span><strong className="text-dark">{formatDate(loanDetails.closed_date)}</strong></div>
                             <div className="col-4 border-end"><span className="text-muted d-block">Total Paid</span><strong className="text-success">{formatCurrency(transactions?.filter(t => ['interest','principal','settlement'].includes(t.payment_type)).reduce((s,t)=>s+parseFloat(t.amount_paid),0))}</strong></div>
                             <div className="col-4"><span className="text-muted d-block">Discount</span><strong className="text-danger">{formatCurrency(discountGiven)}</strong></div>
                          </div>
                    </div>
                </div>
            )}
        </div>

        {/* --- RIGHT COLUMN --- */}
        <div className="col-lg-4">
            <div className="d-flex flex-column gap-3 sticky-top" style={{top: '20px', zIndex: 10}}>
                
                {/* Actions */}
                {(loanDetails.status === 'active' || loanDetails.status === 'overdue') && (
                <>
                    <div className="card border border-secondary-subtle shadow-sm">
                        <div className="card-header bg-primary text-white py-2 px-3"><div className="d-flex align-items-center small fw-bold"><i className="bi bi-cash-coin me-2"></i> Receive Payment</div></div>
                        <div className="card-body p-3"><PaymentForm loanId={id} onPaymentAdded={() => setRefreshTrigger(t => t + 1)} /></div>
                    </div>
                    <div className="card border border-secondary-subtle shadow-sm">
                         <div className="card-body p-3">
                            <label className="small fw-bold text-muted mb-2">Disburse Additional Principal</label>
                            <div className="input-group input-group-sm">
                                <span className="input-group-text">₹</span>
                                <input type="number" className="form-control" placeholder="Amount" value={additionalAmount} onChange={e => setAdditionalAmount(e.target.value)} />
                                <button className="btn btn-outline-primary" onClick={handleAddPrincipal}>Add</button>
                            </div>
                         </div>
                    </div>
                    <div className="card border border-secondary-subtle shadow-sm border-top border-4 border-success">
                        <div className="card-body p-3">
                            <h6 className="fw-bold text-success mb-3 small"><i className="bi bi-check2-all me-2"></i>Settle & Close Loan</h6>
                            <div className="mb-2 p-2 bg-light rounded text-center border border-dashed">
                                 <small className="text-muted">Total Outstanding</small>
                                 <div className="fw-bold text-dark">{formatCurrency(calculatedStats?.amountDue)}</div>
                            </div>
                            <div className="row g-2 mb-2">
                                 <div className="col-6"><label className="small text-muted" style={{fontSize: '0.7rem'}}>Cash Paid</label><input type="number" className="form-control form-control-sm" placeholder="₹" value={settleAmount} onChange={e => handleSettleAmountInput(e.target.value)} /></div>
                                 <div className="col-6"><label className="small text-muted" style={{fontSize: '0.7rem'}}>Discount</label><input type="number" className="form-control form-control-sm" placeholder="₹" value={settleDiscount} onChange={e => handleDiscountInput(e.target.value)} /></div>
                            </div>
                            <button className="btn btn-success btn-sm w-100 fw-bold" onClick={handleSettleAndClose}>CLOSE LOAN</button>
                        </div>
                    </div>
                </>
                )}

                {/* B. Transaction History (Updated) */}
                <div className="card border border-secondary-subtle shadow-sm">
                    <div className="card-header bg-white fw-bold py-2 border-bottom small">Transaction History</div>
                    <div className="card-body p-0">
                        <div className="row g-0">
                            {/* Left: Payments */}
                            <div className="col-6 border-end">
                                <div className="p-1 bg-light small fw-bold text-center text-success border-bottom" style={{fontSize: '0.7rem'}}>Payments In</div>
                                <div className="p-2">
                                    {paymentsReceived.length > 0 ? paymentsReceived.slice(0, 8).map(tx => (
                                        <div key={tx.id} className="mb-2 pb-1 border-bottom border-light">
                                            <span className={`badge border mb-1 ${tx.payment_type === 'discount' ? 'bg-warning text-dark' : 'bg-light text-dark'}`} style={{fontSize: '0.65rem'}}>{tx.payment_type.toUpperCase()}</span>
                                            <div className={`fw-bold small ${tx.payment_type === 'discount' ? 'text-danger' : 'text-success'}`}>
                                                {tx.payment_type === 'discount' ? '-' : ''}{formatCurrency(tx.amount_paid)}
                                            </div>
                                            <div className="text-muted" style={{fontSize: '0.65rem'}}>{formatDateTime(tx.payment_date)}</div>
                                            <div className="text-muted fst-italic" style={{fontSize: '0.6rem'}}>by: {tx.changed_by_username || 'sys'}</div>
                                        </div>
                                    )) : <div className="text-center text-muted small py-3">No payments</div>}
                                </div>
                            </div>
                            
                            {/* Right: Disbursements */}
                            <div className="col-6">
                                <div className="p-1 bg-light small fw-bold text-center text-primary border-bottom" style={{fontSize: '0.7rem'}}>Disbursements</div>
                                <div className="p-2">
                                    {enrichedDisbursements.length > 0 ? enrichedDisbursements.slice(0, 8).map(tx => (
                                        <div key={tx.id} className="mb-2 pb-1 border-bottom border-light">
                                            <div className="text-muted" style={{fontSize: '0.65rem'}}>Prev: {formatCurrency(tx.prevBalance)}</div>
                                            <div className="fw-bold text-primary small">{formatCurrency(tx.amount_paid)}</div>
                                            <div className="text-muted" style={{fontSize: '0.65rem'}}>{formatDateTime(tx.payment_date)}</div>
                                            <div className="text-muted fst-italic" style={{fontSize: '0.6rem'}}>by: {tx.changed_by_username || 'sys'}</div>
                                        </div>
                                    )) : <div className="text-center text-muted small py-3">Initial only</div>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* --- MODALS --- */}
      {showPrintModal && (
        <div style={modalOverlayStyle}>
          <div className="bg-white rounded-3 overflow-hidden shadow" style={{width: '90%', maxWidth:'800px', maxHeight:'90vh', display:'flex', flexDirection:'column'}}>
            <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-light">
              <h5 className="m-0">Invoice Preview</h5>
              <button type="button" className="btn-close" onClick={() => setShowPrintModal(false)}></button>
            </div>
            <div className="p-4 overflow-auto bg-secondary bg-opacity-10" style={{flex:1}}>
              <div className="d-flex justify-content-center"><div className="bg-white shadow-sm p-1" style={{maxWidth: '210mm'}}>{loanDetails && <PrintableInvoice loanDetails={loanDetails} />}</div></div>
            </div>
            <div className="p-3 border-top bg-white text-end">
              <button className="btn btn-secondary me-2" onClick={() => setShowPrintModal(false)}>Close</button>
              <button className="btn btn-outline-primary me-2" onClick={handleSavePdf}><i className="bi bi-download me-1"></i> PDF</button>
              <button className="btn btn-primary" onClick={handleReactPrint}><i className="bi bi-printer-fill me-1"></i> Print</button>
            </div>
          </div>
        </div>
      )}

      {showHistoryModal && <LoanHistoryModal loanId={id} onClose={() => setShowHistoryModal(false)} />}
      
      {showRenewModal && (
        <RenewLoanModal
          loan={loanDetails}
          outstandingInterest={calculatedStats ? parseFloat(calculatedStats.outstandingInterest) : 0}
          currentPrincipal={calculatedStats ? parseFloat(calculatedStats.outstandingPrincipal) : 0}
          onClose={() => setShowRenewModal(false)}
          onRenewalSuccess={(newLoanId) => { setShowRenewModal(false); navigate(`/loans/${newLoanId}`); }}
        />
      )}

      <div style={hiddenPrintComponentStyle}>
        {loanDetails && <PrintableInvoice ref={invoiceRef} loanDetails={loanDetails} />}
      </div>
    </div>
  );
}

export default LoanPage;