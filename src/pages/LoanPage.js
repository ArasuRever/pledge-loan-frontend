import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import useAuth from '../hooks/useAuth'; // Assuming you have a useAuth hook for user role

const API_URL = process.env.REACT_APP_API_URL;

// Components (Assuming you have these in a separate file or inline)
const AddPaymentModal = ({ loanId, customerId, fetchLoanData, show, handleClose }) => {
    const [amount, setAmount] = useState('');
    const [paymentType, setPaymentType] = useState('interest');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await axios.post(`${API_URL}/api/transactions`, {
                loan_id: loanId,
                amount_paid: amount,
                payment_type: paymentType,
            });
            alert('Payment added successfully.');
            setAmount('');
            setPaymentType('interest');
            fetchLoanData();
            handleClose();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to add payment.');
        } finally {
            setLoading(false);
        }
    };

    if (!show) return null;

    return (
        <div className="modal show d-block" tabIndex="-1">
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Add New Payment</h5>
                        <button type="button" className="btn-close" onClick={handleClose}></button>
                    </div>
                    <div className="modal-body">
                        {error && <div className="alert alert-danger">{error}</div>}
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label">Amount</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="form-control"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Payment Type</label>
                                <select
                                    className="form-select"
                                    value={paymentType}
                                    onChange={(e) => setPaymentType(e.target.value)}
                                >
                                    <option value="interest">Interest</option>
                                    <option value="principal">Principal</option>
                                </select>
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? 'Saving...' : 'Record Payment'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AddPrincipalModal = ({ loanId, fetchLoanData, show, handleClose }) => {
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await axios.post(`${API_URL}/api/loans/${loanId}/add-principal`, {
                additionalAmount: amount,
            });
            alert('Principal added successfully.');
            setAmount('');
            fetchLoanData();
            handleClose();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to add principal.');
        } finally {
            setLoading(false);
        }
    };

    if (!show) return null;

    return (
        <div className="modal show d-block" tabIndex="-1">
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Add Principal / Top-up</h5>
                        <button type="button" className="btn-close" onClick={handleClose}></button>
                    </div>
                    <div className="modal-body">
                        {error && <div className="alert alert-danger">{error}</div>}
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label">Additional Principal Amount</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="form-control"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    required
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? 'Saving...' : 'Add Principal'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

const EditLoanModal = ({ loan, fetchLoanData, show, handleClose }) => {
    const [data, setData] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (loan) {
            // Populate form with existing data, format date for input type="date"
            setData({
                principalAmount: loan.principal_amount || '',
                interestRate: loan.interest_rate || '',
                loanPeriod: loan.loan_period || '',
                dueDate: loan.due_date ? format(parseISO(loan.due_date), 'yyyy-MM-dd') : '',
                itemDescription: loan.item_description || '',
            });
        }
    }, [loan]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            // Prepare data for API, converting numbers back to strings if necessary
            const updateData = {
                principal_amount: data.principalAmount,
                interest_rate: data.interestRate,
                loan_period: data.loanPeriod,
                due_date: data.dueDate,
                item_description: data.itemDescription,
            };

            await axios.put(`${API_URL}/api/loans/${loan.id}`, updateData);
            alert('Loan details updated successfully.');
            fetchLoanData();
            handleClose();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update loan details.');
        } finally {
            setLoading(false);
        }
    };

    if (!show || !loan) return null;

    return (
        <div className="modal show d-block" tabIndex="-1">
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Edit Loan #{loan.book_loan_number}</h5>
                        <button type="button" className="btn-close" onClick={handleClose}></button>
                    </div>
                    <div className="modal-body">
                        {error && <div className="alert alert-danger">{error}</div>}
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label">Principal Amount (₹)</label>
                                <input type="number" step="0.01" className="form-control" name="principalAmount" value={data.principalAmount} onChange={handleChange} required />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Interest Rate (%)</label>
                                <input type="number" step="0.01" className="form-control" name="interestRate" value={data.interestRate} onChange={handleChange} required />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Loan Period (Days)</label>
                                <input type="number" className="form-control" name="loanPeriod" value={data.loanPeriod} onChange={handleChange} required />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Due Date</label>
                                <input type="date" className="form-control" name="dueDate" value={data.dueDate} onChange={handleChange} required />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Pledged Item Description</label>
                                <textarea className="form-control" name="itemDescription" value={data.itemDescription} onChange={handleChange} required />
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? 'Saving...' : 'Update Loan'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SettleLoanModal = ({ loanId, customerId, fetchLoanData, show, handleClose, balance, currentInterest }) => {
    const [discountAmount, setDiscountAmount] = useState('0');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const totalDue = parseFloat(balance) + parseFloat(currentInterest);
    const finalSettlementAmount = (totalDue - parseFloat(discountAmount || 0)).toFixed(2);
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!window.confirm(`Confirm settlement: Loan #${loanId} will be marked as PAID with a final amount of ₹${finalSettlementAmount}. Principal balance and all outstanding interest will be zeroed out. Continue?`)) {
            return;
        }

        setLoading(true);
        setError(null);
        try {
            await axios.post(`${API_URL}/api/loans/${loanId}/settle`, {
                discountAmount: discountAmount || '0',
                settlementAmount: finalSettlementAmount.toString(), // The required final settlement amount
            });
            alert(`Loan settled successfully! Final amount: ₹${finalSettlementAmount}`);
            fetchLoanData();
            handleClose();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to settle loan.');
        } finally {
            setLoading(false);
        }
    };

    if (!show) return null;

    return (
        <div className="modal show d-block" tabIndex="-1">
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Settle Loan</h5>
                        <button type="button" className="btn-close" onClick={handleClose}></button>
                    </div>
                    <div className="modal-body">
                        {error && <div className="alert alert-danger">{error}</div>}
                        <p><strong>Principal Balance:</strong> ₹{parseFloat(balance).toFixed(2)}</p>
                        <p><strong>Outstanding Interest:</strong> ₹{parseFloat(currentInterest).toFixed(2)}</p>
                        <p><strong>Total Amount Due:</strong> ₹{totalDue.toFixed(2)}</p>
                        <hr/>

                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label">Discount Amount (Optional)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="form-control"
                                    value={discountAmount}
                                    onChange={(e) => setDiscountAmount(e.target.value)}
                                    min="0"
                                    max={totalDue}
                                />
                                <small className="form-text text-muted">Amount to be waived from the total due.</small>
                            </div>
                            <div className="alert alert-info">
                                <strong>Final Settlement Amount:</strong> ₹{finalSettlementAmount}
                            </div>
                            <button type="submit" className="btn btn-success" disabled={loading}>
                                {loading ? 'Processing...' : 'Settle Loan as PAID'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Main Component ---
function LoanPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { userRole } = useAuth(); // Get user role from context
    
    const [loan, setLoan] = useState(null);
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);

    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showPrincipalModal, setShowPrincipalModal] = useState(false);
    const [showSettleModal, setShowSettleModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    // Fetch loan details and history
    const fetchLoanData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [loanResponse, historyResponse] = await Promise.all([
                axios.get(`${API_URL}/api/loans/${id}`),
                axios.get(`${API_URL}/api/loans/${id}/history`)
            ]);
            setLoan(loanResponse.data);
            setHistory(historyResponse.data);
        } catch (err) {
            setError(err.response?.data?.error || "Failed to load loan data.");
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchLoanData();
    }, [fetchLoanData]);

    const formatCurrency = (amount) => {
        return `₹${parseFloat(amount || 0).toFixed(2)}`;
    };

    const getStatusBadge = (status) => {
        let colorClass = 'bg-secondary';
        if (status === 'active') colorClass = 'bg-primary';
        else if (status === 'overdue') colorClass = 'bg-danger';
        else if (status === 'paid') colorClass = 'bg-success';
        else if (status === 'forfeited') colorClass = 'bg-warning text-dark';
        return <span className={`badge ${colorClass}`}>{status.toUpperCase()}</span>;
    };

    // --- Action Handlers ---

    const handleSoftDelete = async () => {
        if (loan.status === 'deleted') return; // Should not happen if page is guarded
        if (!window.confirm(`⚠️ WARNING: Are you sure you want to soft-delete Loan #${loan.book_loan_number}? It will be moved to the Recycle Bin and marked as 'deleted'.`)) {
            return;
        }
        try {
            const response = await axios.delete(`${API_URL}/api/loans/${id}`);
            setMessage(response.data.message || `Loan #${loan.book_loan_number} successfully soft-deleted.`);
            // Update UI to reflect deletion, or simply refresh
            fetchLoanData(); 
            navigate('/loans'); // Redirect to loans list after deletion
        } catch (err) {
            setError(err.response?.data?.error || "Failed to soft-delete loan.");
        }
    };
    
    // --- UI Rendering ---

    if (isLoading) return <div className="text-center mt-5">Loading Loan Details...</div>;
    if (error) return <div className="alert alert-danger m-4">Error: {error}</div>;
    if (!loan) return <div className="alert alert-warning m-4">Loan not found.</div>;

    const isActionable = loan.status === 'active' || loan.status === 'overdue';

    return (
        <div className="container-fluid py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Loan Details: #{loan.book_loan_number}</h2>
                <div>
                    {isActionable && (
                        <>
                            <button className="btn btn-sm btn-info me-2" onClick={() => setShowEditModal(true)}>
                                <i className="bi bi-pencil-square"></i> Edit Loan
                            </button>
                            {userRole === 'admin' && (
                                <button className="btn btn-sm btn-danger" onClick={handleSoftDelete}>
                                    <i className="bi bi-trash"></i> Soft Delete
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {message && <div className="alert alert-success">{message}</div>}

            <div className="row">
                {/* --- Main Details Card --- */}
                <div className="col-lg-8">
                    <div className="card shadow-sm mb-4">
                        <div className="card-header bg-primary text-white">
                            <h5 className="mb-0">Summary & Status</h5>
                        </div>
                        <div className="card-body">
                            <div className="row">
                                <div className="col-md-6">
                                    <p><strong>Customer:</strong> <a href={`/customers/${loan.customer_id}`}>{loan.customer_name}</a></p>
                                    <p><strong>Disbursed Principal:</strong> {formatCurrency(loan.principal_amount)}</p>
                                    <p><strong>Loan Date:</strong> {format(parseISO(loan.loan_date), 'dd-MMM-yyyy')}</p>
                                    <p><strong>Due Date:</strong> {format(parseISO(loan.due_date), 'dd-MMM-yyyy')}</p>
                                    <p><strong>Loan Status:</strong> {getStatusBadge(loan.status)}</p>
                                </div>
                                <div className="col-md-6">
                                    <p><strong>Interest Rate:</strong> {loan.interest_rate}% per {loan.loan_period} days</p>
                                    <p><strong>Outstanding Balance:</strong> {formatCurrency(loan.remaining_principal)}</p>
                                    <p><strong>Current Interest Due:</strong> {formatCurrency(loan.current_interest_due)}</p>
                                    <p><strong>Total Interest Paid:</strong> {formatCurrency(loan.total_interest_paid)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- Pledged Item Card --- */}
                    <div className="card shadow-sm mb-4">
                        <div className="card-header bg-secondary text-white">
                            <h5 className="mb-0">Pledged Item</h5>
                        </div>
                        <div className="card-body">
                            <p><strong>Description:</strong> {loan.item_description}</p>
                            {loan.item_photo_url && (
                                <div className="mt-3">
                                    <strong>Pledged Photo:</strong>
                                    <img 
                                        src={loan.item_photo_url} 
                                        alt="Pledged Item" 
                                        className="img-fluid rounded mt-2" 
                                        style={{ maxWidth: '300px', maxHeight: '300px', objectFit: 'cover' }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* --- Actions Card (Right Column) --- */}
                <div className="col-lg-4">
                    <div className="card shadow-sm mb-4 bg-light">
                        <div className="card-header bg-dark text-white">
                            <h5 className="mb-0">Actions</h5>
                        </div>
                        <div className="card-body">
                            <div className="d-grid gap-2">
                                {isActionable ? (
                                    <>
                                        <button className="btn btn-success btn-lg" onClick={() => setShowPaymentModal(true)}>
                                            <i className="bi bi-wallet"></i> Add Payment
                                        </button>
                                        <button className="btn btn-warning btn-lg" onClick={() => setShowPrincipalModal(true)}>
                                            <i className="bi bi-plus-circle"></i> Add Principal/Top-up
                                        </button>
                                        <button className="btn btn-primary btn-lg" onClick={() => setShowSettleModal(true)}>
                                            <i className="bi bi-check-circle"></i> Settle Loan
                                        </button>
                                    </>
                                ) : (
                                    <div className="alert alert-info text-center">
                                        This loan is **{loan.status.toUpperCase()}**. No further actions available.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- History Table --- */}
            <div className="row mt-4">
                <div className="col-12">
                    <div className="card shadow-sm">
                        <div className="card-header bg-info text-white">
                            <h5 className="mb-0">Loan History / Transactions</h5>
                        </div>
                        <div className="card-body">
                            <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                <table className="table table-striped table-hover">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Type</th>
                                            <th>Description</th>
                                            <th>Amount (₹)</th>
                                            <th>Balance After (₹)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {history.length > 0 ? (
                                            history.map((item, index) => (
                                                <tr key={index}>
                                                    <td>{format(parseISO(item.timestamp), 'dd-MMM-yyyy HH:mm')}</td>
                                                    <td><span className={`badge ${item.type === 'Transaction' ? 'bg-success' : item.type === 'Action' ? 'bg-primary' : 'bg-secondary'}`}>{item.type.toUpperCase()}</span></td>
                                                    <td>{item.description}</td>
                                                    <td>{item.amount_change ? formatCurrency(item.amount_change) : '-'}</td>
                                                    <td>{item.new_principal_balance ? formatCurrency(item.new_principal_balance) : '-'}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan="5" className="text-center">No history recorded for this loan.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Modals --- */}
            <AddPaymentModal
                loanId={loan.id}
                customerId={loan.customer_id}
                fetchLoanData={fetchLoanData}
                show={showPaymentModal}
                handleClose={() => setShowPaymentModal(false)}
            />
            <AddPrincipalModal
                loanId={loan.id}
                fetchLoanData={fetchLoanData}
                show={showPrincipalModal}
                handleClose={() => setShowPrincipalModal(false)}
            />
            <SettleLoanModal
                loanId={loan.id}
                customerId={loan.customer_id}
                fetchLoanData={fetchLoanData}
                show={showSettleModal}
                handleClose={() => setShowSettleModal(false)}
                balance={loan.remaining_principal}
                currentInterest={loan.current_interest_due}
            />
            <EditLoanModal
                loan={loan}
                fetchLoanData={fetchLoanData}
                show={showEditModal}
                handleClose={() => setShowEditModal(false)}
            />
        </div>
    );
}

export default LoanPage;