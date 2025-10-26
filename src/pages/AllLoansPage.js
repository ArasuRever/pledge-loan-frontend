// src/pages/AllLoansPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function AllLoansPage() {
  const [loans, setLoans] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [fetchError, setFetchError] = useState(null); // Add state for error message

  useEffect(() => {
    const fetchAllLoans = async () => {
        setIsLoading(true);
        setFetchError(null); // Clear previous errors
        console.log("AllLoansPage: Attempting to fetch /api/loans"); // Log start
        try {
            // Check if Axios default header is set (for debugging)
            console.log("AllLoansPage: Axios Auth Header before fetch:", axios.defaults.headers.common['Authorization']);

            const response = await axios.get('http://localhost:3001/api/loans');
            console.log("AllLoansPage: Fetch successful", response.data); // Log success
            setLoans(response.data);
        } catch (error) {
            console.error("AllLoansPage: Error fetching all loans:", error); // Log the full error
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.error("AllLoansPage: Error response data:", error.response.data);
                console.error("AllLoansPage: Error response status:", error.response.status);
                console.error("AllLoansPage: Error response headers:", error.response.headers);
                 setFetchError(`Failed to load loans. Server responded with status ${error.response.status}. Check console for details.`);
                 if (error.response.status === 401 || error.response.status === 403) {
                     setFetchError("Authentication failed. Please try logging out and logging back in.");
                 }
            } else if (error.request) {
                // The request was made but no response was received
                console.error("AllLoansPage: No response received:", error.request);
                setFetchError("Failed to load loans. No response from server.");
            } else {
                // Something happened in setting up the request that triggered an Error
                console.error('AllLoansPage: Error setting up request:', error.message);
                 setFetchError("Failed to load loans. Error setting up request.");
            }
            setLoans([]); // Ensure loans are empty on error
        } finally {
            setIsLoading(false);
        }
    };
    fetchAllLoans();
  }, []); // Fetch on mount

  // Combine search and status filtering
  const filteredLoans = loans.filter(loan => {
    const statusMatch = filterStatus === 'all' || loan.status === filterStatus;
    if (!statusMatch) return false;
    const term = searchTerm.toLowerCase();
    const nameMatch = loan.customer_name?.toLowerCase().includes(term);
    const phoneMatch = loan.phone_number?.includes(searchTerm);
    const bookMatch = loan.book_loan_number?.toLowerCase().includes(term);
    return nameMatch || phoneMatch || bookMatch;
  });

  // Display Loading or Error State
  if (isLoading) return <div className="text-center mt-5">Loading loans...</div>;
  if (fetchError) return <div className="alert alert-danger mt-3">{fetchError}</div>; // Display fetch error


  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
          <h2>All Loans</h2> {/* Title kept as "All Loans" */}
          <select
              className="form-select form-select-sm w-auto"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              aria-label="Filter by status"
          >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="overdue">Overdue</option>
              <option value="paid">Paid</option>
              <option value="forfeited">Forfeited</option>
          </select>
      </div>

      <input
        type="text"
        className="form-control mb-3"
        placeholder="Search by customer name, phone, or book loan number..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
      />

      <div className="list-group">
        {/* Display message if loading finished but no loans */}
        {!isLoading && !fetchError && filteredLoans.length === 0 ? (
           <div className="list-group-item text-muted">No loans found matching your criteria.</div>
        ) : (
          filteredLoans.map(loan => (
            <Link key={loan.id} to={`/loans/${loan.id}`} className="list-group-item list-group-item-action">
              <div className="d-flex w-100 justify-content-between">
                <h5 className="mb-1">Loan #{loan.id} for {loan.customer_name}</h5>
                <small className='d-flex align-items-center'>
                   <span className={`badge me-2 bg-${
                       loan.status === 'overdue' ? 'danger' :
                       loan.status === 'paid' ? 'secondary' :
                       loan.status === 'forfeited' ? 'dark' : 'success'
                   }`}>{loan.status}</span>
                   Book #: {loan.book_loan_number}
                </small>
              </div>
              <p className="mb-1">Amount: ₹{parseFloat(loan.principal_amount || 0).toLocaleString('en-IN')}</p>
              <small className="text-muted">
                Pledged: {new Date(loan.pledge_date).toLocaleDateString()}
                {loan.status !== 'paid' && loan.status !== 'forfeited' && ` | Due: ${new Date(loan.due_date).toLocaleDateString()}`}
              </small>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
export default AllLoansPage;