import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import LoanForm from '../components/LoanForm';
import EditCustomerForm from '../components/EditCustomerForm';

function CustomerPage() {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [loans, setLoans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // State to trigger refresh

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const customerPromise = axios.get(`http://localhost:3001/api/customers/${id}`);
        const loansPromise = axios.get(`http://localhost:3001/api/customers/${id}/loans`);
        const [customerResponse, loansResponse] = await Promise.all([customerPromise, loansPromise]);
        setCustomer(customerResponse.data);
        setLoans(loansResponse.data);
      } catch (err) {
        console.error("Error fetching customer data:", err);
        setError("Customer not found or an error occurred.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, refreshTrigger]); // Add refreshTrigger as dependency

  if (isLoading) return <div>Loading customer details...</div>;
  if (error) return <div><p>{error}</p><Link to="/customers">Go back to Customers</Link></div>;
  if (!customer) return null;

  if (isEditing) {
      return (
          <EditCustomerForm 
              customer={customer} 
              onUpdate={() => { 
                  setIsEditing(false);
                  setRefreshTrigger(t => t + 1); // Trigger a refresh
              }}
              onCancel={() => setIsEditing(false)}
          />
      );
  }
  
  const activeLoans = loans.filter(loan => loan.status === 'active' || loan.status === 'overdue');
  const closedLoans = loans.filter(loan => loan.status === 'paid' || loan.status === 'forfeited');

  return (
    <div>
      <div className="d-flex justify-content-end mb-3">
        <button className="btn btn-outline-warning" onClick={() => setIsEditing(true)}>
          Edit Profile & Photo
        </button>
      </div>

      {customer.customer_image_url && (
        <img 
          src={customer.customer_image_url} 
          alt={customer.name} // Fix for redundant-alt warning
          style={{ maxWidth: '150px', maxHeight: '150px', marginBottom: '15px', display: 'block', borderRadius: '5px' }} 
        />
      )}

      <h2>{customer.name}</h2>
      <p><strong>Phone:</strong> {customer.phone_number}</p>
      <p><strong>Address:</strong> {customer.address}</p>

      {/* Pass the refresh function to the form */}
      <LoanForm customerId={id} onLoanAdded={() => setRefreshTrigger(t => t + 1)} />

      <hr />
      
       <div className="mt-4">
        <h3>Active Loans</h3>
        {activeLoans.length > 0 ? (
          <div className="list-group">
            {activeLoans.map(loan => (
              <Link key={loan.loan_id} to={`/loans/${loan.loan_id}`} className="list-group-item list-group-item-action">
                Loan #{loan.loan_id} - ₹{loan.principal_amount} {loan.description ? `for ${loan.description}` : ''}
                 <small className="d-block text-muted">Pledged: {new Date(loan.pledge_date).toLocaleDateString()} | Due: {new Date(loan.due_date).toLocaleDateString()}</small>
              </Link>
            ))}
          </div>
        ) : (
          <p>No active loans.</p>
        )}
      </div>

      <div className="mt-4">
        <h3>Closed Loans</h3>
        {closedLoans.length > 0 ? (
          <div className="list-group">
            {closedLoans.map(loan => (
              <Link key={loan.loan_id} to={`/loans/${loan.loan_id}`} className="list-group-item list-group-item-action text-muted">
                Loan #{loan.loan_id} - ₹{loan.principal_amount} - Status: {loan.status}
                 <small className="d-block text-muted">Pledged: {new Date(loan.pledge_date).toLocaleDateString()}</small>
              </Link>
            ))}
          </div>
        ) : (
          <p>No closed loans.</p>
        )}
      </div>
      
      <Link to="/customers" className="btn btn-secondary mt-4">Back to Customers</Link>
    </div>
  );
}

export default CustomerPage;