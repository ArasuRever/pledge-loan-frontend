import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import axios from 'axios';
import PaymentForm from '../components/PaymentForm';
import { PrintableInvoice } from '../components/PrintableInvoice';

function LoanPage() {
  const { id } = useParams();
  const [loanData, setLoanData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [discount, setDiscount] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0); // State to trigger refresh

  const invoiceRef = useRef();
  const handlePrint = useReactToPrint({
    content: () => invoiceRef.current,
    documentTitle: `Loan-Invoice-${id}`,
  });

  // Fix for exhaustive-deps: Add 'id' and 'refreshTrigger'
  useEffect(() => {
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
    fetchLoanData();
  }, [id, refreshTrigger]); 

  const handleSettleAndClose = async () => {
    const discountValue = parseFloat(discount) || 0;
    const confirmationMessage = `Settle this loan with a discount of ₹${discountValue.toFixed(2)}. Proceed?`;

    if (window.confirm(confirmationMessage)) {
      try {
        const response = await axios.post(`http://localhost:3001/api/loans/${id}/settle`, { 
          discountAmount: discountValue 
        });
        alert(response.data.message);
        setRefreshTrigger(t => t + 1); // Trigger refresh
      } catch (err) {
        if (err.response && err.response.data && err.response.data.error) {
          alert(err.response.data.error);
        } else {
          alert('An unknown error occurred during settlement.');
        }
      }
    }
  };

  if (isLoading) return <div>Loading loan details...</div>;
  if (error || !loanData || !loanData.loanDetails) return <div><p>{error || "Could not load details."}</p><Link to="/">Go Home</Link></div>;

  const { loanDetails, transactions } = loanData;

  return (
    <div>
      
      <div className="card border-primary shadow-sm mb-4">
        <div className="card-body">
            <h4 className="card-title">Customer Information</h4>
            <div className="d-flex align-items-center">
                {loanDetails.customer_image_url && (
                    <img 
                        src={loanDetails.customer_image_url} 
                        alt={loanDetails.customer_name} // Fix for redundant-alt
                        style={{ width: '60px', height: '60px', borderRadius: '50%', marginRight: '15px', objectFit: 'cover' }} 
                    />
                )}
                <div>
                    <h5>{loanDetails.customer_name}</h5>
                    <p className="mb-0">Phone: {loanDetails.phone_number}</p>
                    <p className="mb-0 text-muted">Back to <Link to={`/customers/${loanDetails.customer_id}`}>View Customer Profile</Link></p>
                </div>
            </div>
        </div>
      </div>
      
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>Loan Details (ID: {loanDetails.id})</h3>
        <button className="btn btn-info" onClick={handlePrint}>
          Print Invoice
        </button>
      </div>

      <p><strong>Book Loan #:</strong> {loanDetails.book_loan_number}</p>
      <p><strong>Status:</strong> {loanDetails.status}</p>
      <p><strong>Principal Amount:</strong> ₹{loanDetails.principal_amount}</p>
      <p><strong>Interest Rate:</strong> {loanDetails.interest_rate}%</p>
      <p><strong>Pledge Date:</strong> {new Date(loanDetails.pledge_date).toLocaleDateString()}</p>
      
      <h4>Pledged Item</h4>
      {loanDetails.item_image_data_url && (
          <img 
              src={loanDetails.item_image_data_url} 
              alt={loanDetails.description} // Fix for redundant-alt
              style={{ maxWidth: '100px', maxHeight: '100px', marginBottom: '10px', display: 'block' }} 
          />
      )}
      <p>{loanDetails.description} ({loanDetails.item_type})</p>
      <p><strong>Quality:</strong> {loanDetails.quality} | <strong>Weight:</strong> {loanDetails.weight}g</p>

      {(loanDetails.status === 'active' || loanDetails.status === 'overdue') && (
        <div className="card my-4">
          <div className="card-body">
            {/* Fix for no-unused-vars by triggering refresh */}
            <PaymentForm 
              loanId={id} 
              onPaymentAdded={() => setRefreshTrigger(t => t + 1)} 
            />
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
      )}

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

      {/* Hidden Printable Component */}
      <div style={{ display: 'none' }}>
        {/* We pass loanDetails to the invoice, ensuring it has data */}
        {loanDetails && <PrintableInvoice ref={invoiceRef} loanDetails={loanDetails} />}
      </div>

    </div>
  ); 
}

export default LoanPage;