import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export const OverdueLoansPage = () => {
  const [overdueLoans, setOverdueLoans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOverdueLoans = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/loans/overdue');
        setOverdueLoans(response.data);
      } catch (error) {
        console.error("Error fetching overdue loans:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOverdueLoans();
  }, []);

  if (isLoading) return <div>Loading overdue loans...</div>;

  return (
    <div className="card border-danger shadow-sm">
      <div className="card-header text-white bg-danger"><h3>Overdue Loans</h3></div>
      <div className="card-body">
        {overdueLoans.length > 0 ? (
          <div className="list-group">
            {overdueLoans.map(loan => (
              <Link key={loan.id} to={`/loans/${loan.id}`} className="list-group-item list-group-item-action">
                <div className="d-flex w-100 justify-content-between">
                  <h5 className="mb-1">Loan #{loan.id} for {loan.customer_name}</h5>
                  <small className="text-danger fw-bold">Due: {new Date(loan.due_date).toLocaleDateString()}</small>
                </div>
                <p className="mb-1">Amount: ₹{loan.principal_amount} | Book #: {loan.book_loan_number}</p>
                 <small className="text-muted">Pledged On: {new Date(loan.pledge_date).toLocaleDateString()}</small>
              </Link>
            ))}
          </div>
        ) : (
          <p>There are currently no overdue loans.</p>
        )}
      </div>
    </div>
  );
};