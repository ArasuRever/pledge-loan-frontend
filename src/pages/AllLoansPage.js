import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function AllLoansPage() {
  const [loans, setLoans] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAllLoans = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/loans');
        setLoans(response.data);
      } catch (error) {
        console.error("Error fetching all loans:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllLoans();
  }, []);

  const filteredLoans = loans.filter(loan =>
    loan.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (loan.phone_number && loan.phone_number.includes(searchTerm)) ||
    (loan.book_loan_number && loan.book_loan_number.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) return <div>Loading all loans...</div>;

  return (
    <div>
      <h2>All Active Loans</h2>
      <input type="text" className="form-control mb-3" placeholder="Search by customer name, phone, or book loan number..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      <div className="list-group">
        {filteredLoans.length > 0 ? (
          filteredLoans.map(loan => (
            <Link key={loan.id} to={`/loans/${loan.id}`} className="list-group-item list-group-item-action">
              <div className="d-flex w-100 justify-content-between">
                <h5 className="mb-1">Loan #{loan.id} for {loan.customer_name}</h5>
                <small>Book #: {loan.book_loan_number}</small>
              </div>
              <p className="mb-1">Amount: ₹{loan.principal_amount}</p>
              <small className="text-muted">
                Pledged: {new Date(loan.pledge_date).toLocaleDateString()} | Due: {new Date(loan.due_date).toLocaleDateString()}
              </small>
            </Link>
          ))
        ) : (
          <div className="list-group-item">No active loans found.</div>
        )}
      </div>
    </div>
  );
}
export default AllLoansPage;