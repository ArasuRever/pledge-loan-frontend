import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import LoanForm from '../components/LoanForm';

function CustomerPage() {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null); // State for customer details
  const [loans, setLoans] = useState([]); // State for loans list
  const [isLoading, setIsLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error state

  // Function to fetch all data for this page
  const fetchData = async () => {
    setIsLoading(true); // Start loading
    setError(null); // Clear previous errors
    try {
      // Fetch customer details and loans in parallel
      const customerPromise = axios.get(`http://localhost:3001/api/customers/${id}`);
      const loansPromise = axios.get(`http://localhost:3001/api/customers/${id}/loans`);

      const [customerResponse, loansResponse] = await Promise.all([customerPromise, loansPromise]);

      setCustomer(customerResponse.data);
      setLoans(loansResponse.data);

    } catch (err) {
      console.error("Error fetching customer data:", err);
      // Set specific error based on response, or generic error
      if (err.response && err.response.status === 404) {
         setError("Customer not found.");
      } else {
         setError("An error occurred while fetching data.");
      }
    } finally {
      setIsLoading(false); // Stop loading regardless of success/fail
    }
  };

  // Run fetchData once when the component mounts or the ID changes
  useEffect(() => {
    fetchData();
  }, [id]); // Dependency array includes 'id'

  // --- Render logic based on state ---

  if (isLoading) {
    return <div>Loading customer details...</div>; // Show loading indicator
  }

  if (error) {
    // Show error message if something went wrong
    return (
        <div>
            <h2>Error</h2>
            <p>{error}</p>
            <Link to="/customers" className="btn btn-secondary">Go back to Customers</Link>
        </div>
    );
  }

  if (!customer) {
     // Should not happen if loading/error states are correct, but good safety check
     return <div>Could not load customer data.</div>;
  }

  // Filter loans after data is confirmed to be loaded
  const activeLoans = loans.filter(loan => loan.status === 'active' || loan.status === 'overdue');
  const closedLoans = loans.filter(loan => loan.status === 'paid' || loan.status === 'forfeited');

  // --- Main component render ---
  return (
    <div>
      {/* Display Photo */}
      {customer.customer_image_url && (
        <img 
          src={customer.customer_image_url} 
          alt={`${customer.name}'s photo`}
          style={{ maxWidth: '150px', maxHeight: '150px', marginBottom: '15px', display: 'block', borderRadius: '5px' }} 
        />
      )}

      <h2>{customer.name}</h2>
      <p><strong>Phone:</strong> {customer.phone_number}</p>
      <p><strong>Address:</strong> {customer.address}</p>

      <LoanForm customerId={id} onLoanAdded={fetchData} />

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