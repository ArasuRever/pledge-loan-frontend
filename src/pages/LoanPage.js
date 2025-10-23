import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import PaymentForm from '../components/PaymentForm';

function LoanPage() {
  const { id } = useParams();
  const [loanData, setLoanData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [discount, setDiscount] = useState('');

  const fetchLoanData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`http://localhost:3001/api/loans/${id}`);
      setLoanData(response.data);
    } catch (err) {
      setError("Loan not found or an error occurred.");
      console.error("Error fetching loan data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLoanData();
  }, [id]);

  const handleSettleAndClose = async () => {
    // ... (This function remains the same) ...
  };

  if (isLoading) return <div>Loading loan details...</div>;
  if (error || !loanData || !loanData.loanDetails) return <div><p>{error || "Could not load details."}</p><Link to="/">Go Home</Link></div>;

  // The error was here. We already declare loanDetails and transactions here.
  const { loanDetails, transactions } = loanData;

  // The console.log should come *after* the declaration.
  console.log("Loan Details Received:", loanDetails);

  return (
    <div>
      <div className="card border-primary shadow-sm mb-4">
          <div className="card-body">
              <h4 className="card-title">Customer Information</h4>
              <div className="d-flex align-items-center">
                  {loanDetails.customer_image_url && (
                      <img 
                          src={loanDetails.customer_image_url} 
                          alt={`${loanDetails.customer_name}'s photo`}
                          style={{ width: '60px', height: '60px', borderRadius: '50%', marginRight: '15px', objectFit: 'cover' }} 
                      />
                  )}
                  <div>
                      <h5>{loanDetails.customer_name}</h5>
                      <p className="mb-0">Phone: {loanDetails.phone_number}</p>
                  </div>
              </div>
              <hr/>
              <p className="mb-0">Back to <Link to={`/customers/${loanDetails.customer_id}`}>{loanDetails.customer_name}'s Profile</Link></p>
          </div>
      </div>
      <h3>Loan Details (ID: {id})</h3>
      <p><strong>Book Loan #:</strong> {loanDetails.book_loan_number}</p>
      <p><strong>Status:</strong> {loanDetails.status}</p>
      <p><strong>Principal Amount:</strong> ₹{loanDetails.principal_amount}</p>
      <p><strong>Interest Rate:</strong> {loanDetails.interest_rate}%</p>
      <p><strong>Pledge Date:</strong> {new Date(loanDetails.pledge_date).toLocaleDateString()}</p>

      <h4>Pledged Item</h4>
      {loanDetails.item_image_data_url && (
      <img 
          src={loanDetails.item_image_data_url} 
          alt="Pledged item"
          style={{ maxWidth: '100px', maxHeight: '100px', marginBottom: '10px', display: 'block' }} 
      />
      )}
      <p>{loanDetails.description} ({loanDetails.item_type})</p>
      <p><strong>Quality:</strong> {loanDetails.quality} | <strong>Weight:</strong> {loanDetails.weight}g</p>

      {loanDetails.status === 'active' || loanDetails.status === 'overdue' ? (
        <div className="card my-4">
          <div className="card-body">
            <PaymentForm loanId={id} onPaymentAdded={fetchLoanData} />
            <hr className="my-3"/>
            <h4>Settle & Close Loan</h4>
            <p className="text-muted small">Enter a discount amount to waive some of the balance before closing.</p>
            <div className="d-flex">
              <input
                type="number"
                className="form-control me-2"
                value={discount}
                onChange={e => setDiscount(e.target.value)}
                placeholder="Discount Amount (₹)"
              />
              <button
                onClick={handleSettleAndClose}
                className="btn btn-success">
                Settle & Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <hr />

      <h4>Payment History</h4>
      {transactions && transactions.length > 0 ? (
        <ul className="list-group">
          {transactions.map(tx => (
            <li key={tx.id} className="list-group-item">
              {new Date(tx.payment_date).toLocaleDateString()}: <strong>₹{tx.amount_paid}</strong> ({tx.payment_type})
            </li>
          ))}
        </ul>
      ) : (
        <p>No payments have been made for this loan yet.</p>
      )}
      <br/>
      <Link to={`/customers/${loanDetails.customer_id}`} className="btn btn-secondary">Back to Customer Page</Link>
    </div>
  );
}

export default LoanPage;