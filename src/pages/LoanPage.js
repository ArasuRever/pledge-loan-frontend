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

// ... (Styles remain same) ...
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1050 };
const modalContentStyle = { backgroundColor: 'white', padding: '20px', borderRadius: '8px', width: '80%', maxWidth: '800px', maxHeight: '85vh', overflowY: 'auto', border: '1px solid #ccc', boxShadow: '0 5px 15px rgba(0, 0, 0, 0.2)' };
const modalHeaderStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' };
const modalBodyStyle = { marginBottom: '20px' };
const modalFooterStyle = { borderTop: '1px solid #eee', paddingTop: '15px', textAlign: 'right' };
const hiddenPrintComponentStyle = { position: 'fixed', top: 0, left: 0, width: '210mm', minHeight: '297mm', zIndex: -1000, opacity: 0, pointerEvents: 'none', backgroundColor: 'white' };

function LoanPage({ userRole }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loanData, setLoanData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [settleAmount, setSettleAmount] = useState('');
  const [settleDiscount, setSettleDiscount] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [additionalAmount, setAdditionalAmount] = useState('');

  const [calculatedStats, setCalculatedStats] = useState(null);
  const [interestBreakdown, setInterestBreakdown] = useState([]);

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

  if (isLoading) return <div className="text-center mt-5"><div className="spinner-border text-primary"></div></div>;
  if (error) return <div className="alert alert-danger m-4">{error}</div>;
  if (!loanData?.loanDetails) return <div className="alert alert-warning">Loan data missing.</div>;

  const { loanDetails, transactions } = loanData;
  const formatCurrency = (amount) => `₹${parseFloat(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatDate = (date) => { try { return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); } catch (e) { return 'N/A'; } };

  const paymentsReceived = transactions?.filter(tx => tx.payment_type !== 'disbursement' && tx.payment_type !== 'discount') || [];
  const disbursementsMade = transactions?.filter(tx => tx.payment_type === 'disbursement') || [];
  const discountGiven = transactions?.filter(tx => tx.payment_type === 'discount').reduce((sum, tx) => sum + parseFloat(tx.amount_paid), 0) || 0;
  
  const renderSettlementSummary = () => {
    if (loanDetails.status !== 'paid') return null;
    const allTxs = transactions || [];
    const payTxs = allTxs.filter(t => ['interest', 'principal', 'settlement'].includes(t.payment_type));
    const discountTxs = allTxs.filter(t => t.payment_type === 'discount');
    const totalPrincipal = parseFloat(loanDetails.principal_amount);
    const totalCashPaid = payTxs.reduce((sum, t) => sum + parseFloat(t.amount_paid), 0);
    const totalDiscount = discountTxs.reduce((sum, t) => sum + parseFloat(t.amount_paid), 0);
    const totalSettledValue = totalCashPaid + totalDiscount;
    const impliedInterest = totalSettledValue - totalPrincipal;

    return (
      <div className="card shadow-sm mb-4 border-success">
        <div className="card-header bg-success text-white"><i className="bi bi-check-circle-fill me-2"></i>Settlement Summary (Closed)</div>
        <div className="card-body">
          <table className="table table-borderless table-sm mb-0">
            <tbody>
              <tr><td>Total Principal Disbursed</td><td className="text-end">{formatCurrency(totalPrincipal)}</td></tr>
              <tr><td>+ Interest & Charges</td><td className="text-end">{formatCurrency(impliedInterest)}</td></tr>
              <tr className="border-top"><td className="fw-bold">Total Value Settled</td><td className="text-end fw-bold">{formatCurrency(totalSettledValue)}</td></tr>
              <tr><td className="text-success">- Total Cash Paid</td><td className="text-end text-success">-{formatCurrency(totalCashPaid)}</td></tr>
              {totalDiscount > 0 && (<tr><td className="text-danger">- Discount / Waiver</td><td className="text-end text-danger">-{formatCurrency(totalDiscount)}</td></tr>)}
              <tr className="border-top border-2"><td className="fw-bold">Outstanding Balance</td><td className="text-end fw-bold">₹0.00</td></tr>
            </tbody>
          </table>
          <div className="text-center mt-3 small text-muted"><i className="bi bi-calendar-check me-1"></i>Loan settled on {loanDetails.closed_date ? formatDate(loanDetails.closed_date) : 'N/A'}</div>
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
          {userRole === 'admin' && (
            <button className="btn btn-danger btn-sm ms-2" onClick={handleDeleteLoan}><i className="bi bi-trash me-1"></i> Delete</button>
          )}
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-8">
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

          {calculatedStats && (
            <div className="card shadow-sm mb-4 border-primary">
              <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                <span><i className="bi bi-calculator me-2"></i>Loan Calculation Worksheet</span>
                {loanDetails.status === 'paid' && <span className="badge bg-white text-success">SETTLED</span>}
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <h6 className="text-muted text-uppercase small fw-bold">Principal Breakdown</h6>
                  <div className="d-flex justify-content-between border-bottom pb-1">
                    <span>Total Principal Disbursed</span>
                    <span>{formatCurrency(loanDetails.principal_amount)}</span>
                  </div>
                  <div className="d-flex justify-content-between border-bottom pb-1 text-success">
                    <span>- Principal Repaid</span>
                    <span>- {formatCurrency(calculatedStats.principalPaid)}</span>
                  </div>
                  <div className="d-flex justify-content-between pt-1 fw-bold text-primary">
                    <span>Net Principal Balance</span>
                    <span>{formatCurrency(calculatedStats.outstandingPrincipal)}</span>
                  </div>
                </div>

                <div className="mb-3">
                  <h6 className="text-muted text-uppercase small fw-bold mt-4">Interest on Running Balance (Reducing)</h6>
                  <div className="table-responsive">
                    <table className="table table-sm table-striped table-bordered small mb-0">
                      <thead className="table-light">
                        <tr><th>Period</th><th className="text-end">On Balance</th><th className="text-end">Months</th><th className="text-end">Interest</th></tr>
                      </thead>
                      <tbody>
                        {interestBreakdown.map((item, idx) => (
                          <tr key={idx}>
                            <td><div>{formatDate(item.date)} <span className="text-muted">to</span> {item.endDate ? formatDate(item.endDate) : 'Today'}</div><div className="text-muted fst-italic" style={{ fontSize: '0.85em' }}>{item.label}</div></td>
                            <td className="text-end">{formatCurrency(item.amount)}</td>
                            <td className="text-end">{parseFloat(item.months).toFixed(2)}</td>
                            <td className="text-end fw-bold">{formatCurrency(item.interest)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="table-light">
                        <tr><td colSpan="3" className="text-end fw-bold">Total Interest Accrued:</td><td className="text-end fw-bold">{formatCurrency(calculatedStats.totalInterestOwed)}</td></tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                <div className="bg-light p-3 rounded">
                  <div className="d-flex justify-content-between mb-1"><span>Total Interest Accrued</span><span className="fw-bold">{formatCurrency(calculatedStats.totalInterestOwed)}</span></div>
                  <div className="d-flex justify-content-between mb-1 text-success"><span>- Interest Paid</span><span>- {formatCurrency(calculatedStats.interestPaid)}</span></div>
                  {discountGiven > 0 && (<div className="d-flex justify-content-between mb-1 text-danger"><span>- Discount / Waiver</span><span>- {formatCurrency(discountGiven)}</span></div>)}
                  <div className="border-top border-secondary my-2"></div>
                  <div className="d-flex justify-content-between align-items-center"><span className="fw-bold fs-5">Total Amount Due</span><span className="fw-bold fs-4 text-danger">{loanDetails.status === 'paid' ? '₹0.00' : formatCurrency(calculatedStats.amountDue)}</span></div>
                  {loanDetails.status !== 'paid' && (<div className="text-end text-muted small fst-italic">(Principal: {formatCurrency(calculatedStats.outstandingPrincipal)} + Interest: {formatCurrency(parseFloat(calculatedStats.amountDue) - parseFloat(calculatedStats.outstandingPrincipal))})</div>)}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="col-lg-4">
          {(loanDetails.status === 'active' || loanDetails.status === 'overdue') && (
            <div className="card border-info shadow-sm mb-4">
              <div className="card-header bg-info text-dark fw-bold">Disburse More Principal</div>
              <div className="card-body">
                <div className="d-flex">
                  <input type="number" step="0.01" className="form-control form-control-sm me-2" value={additionalAmount} onChange={e => setAdditionalAmount(e.target.value)} placeholder="Amount (₹)" />
                  <button onClick={handleAddPrincipal} className="btn btn-primary btn-sm">Add</button>
                </div>
              </div>
            </div>
          )}

          {(loanDetails.status === 'active' || loanDetails.status === 'overdue') && (
            <div className="card border-primary shadow-sm mb-4">
              <div className="card-header bg-primary text-white fw-bold">Add Partial Payment</div>
              <div className="card-body">
                <p className="small text-muted mb-2">Log regular interest or principal payments here.</p>
                <PaymentForm loanId={id} onPaymentAdded={() => setRefreshTrigger(t => t + 1)} />
              </div>
            </div>
          )}

          {(loanDetails.status === 'active' || loanDetails.status === 'overdue') && (
            <div className="card border-warning shadow-sm mb-4">
              <div className="card-header bg-warning text-dark fw-bold">Settle & Close Loan</div>
              <div className="card-body">
                <p className="small text-muted mb-3">Finalize loan. Auto-calculates remaining.</p>
                <div className="mb-2"><label className="form-label small fw-bold">Outstanding Balance</label><div className="form-control bg-light text-end fw-bold">{formatCurrency(calculatedStats?.amountDue)}</div></div>
                <div className="row g-2 mb-3">
                  <div className="col-6"><label className="form-label small">Cash Paid</label><input type="number" step="0.01" className="form-control" value={settleAmount} onChange={e => handleSettleAmountInput(e.target.value)} placeholder="₹" /></div>
                  <div className="col-6"><label className="form-label small">Discount</label><input type="number" step="0.01" className="form-control" value={settleDiscount} onChange={e => handleDiscountInput(e.target.value)} placeholder="₹" /></div>
                </div>
                <button onClick={handleSettleAndClose} className="btn btn-success w-100 fw-bold"><i className="bi bi-check-circle-fill me-2"></i> CONFIRM SETTLEMENT</button>
              </div>
            </div>
          )}

          <div className="card shadow-sm mb-4">
            <div className="card-header fw-bold">Transaction History</div>
            <div className="card-body">
                <div className="row">
                    {/* Left Column: Payments */}
                    <div className="col-6 border-end pe-3">
                        <h6 className="text-success mb-3 border-bottom pb-2">Payments Received</h6>
                        {paymentsReceived.length > 0 ? (
                            <ul className="list-unstyled small mb-0">
                                {paymentsReceived.map(tx => (
                                    <li key={tx.id} className="mb-2 pb-2 border-bottom border-light">
                                        <div className="d-flex justify-content-between">
                                            <span>{formatDate(tx.payment_date)}</span>
                                            <strong className="text-success">{formatCurrency(tx.amount_paid)}</strong>
                                        </div>
                                        <div className="text-muted d-flex justify-content-between" style={{fontSize: '0.85em'}}>
                                            <span>{tx.payment_type.toUpperCase()}</span>
                                            {tx.changed_by_username && <span>by: {tx.changed_by_username}</span>}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="text-muted small mb-0">No payments recorded.</p>}
                    </div>

                    {/* Right Column: Disbursements */}
                    <div className="col-6 ps-3">
                        <h6 className="text-primary mb-3 border-bottom pb-2">Principal Disbursed</h6>
                        {disbursementsMade.length > 0 ? (
                            <ul className="list-unstyled small mb-0">
                                {disbursementsMade.map(tx => (
                                    <li key={tx.id} className="mb-2 pb-2 border-bottom border-light">
                                        <div className="d-flex justify-content-between">
                                            <span>{formatDate(tx.payment_date)}</span>
                                            <strong className="text-primary">{formatCurrency(tx.amount_paid)}</strong>
                                        </div>
                                        <div className="text-muted d-flex justify-content-between" style={{fontSize: '0.85em'}}>
                                            <span>DISBURSEMENT</span>
                                            {tx.changed_by_username && <span>by: {tx.changed_by_username}</span>}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="text-muted small mb-0">Initial only.</p>}
                    </div>
                </div>
            </div>
          </div>
          
          {renderSettlementSummary()}
        </div>
      </div>

      <div className="mt-3 mb-5"><Link to={`/customers/${loanDetails.customer_id}`} className="btn btn-secondary btn-sm">Back to Customer</Link></div>

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
          outstandingInterest={calculatedStats ? parseFloat(calculatedStats.outstandingInterest) : 0}
          currentPrincipal={calculatedStats ? parseFloat(calculatedStats.outstandingPrincipal) : 0}
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