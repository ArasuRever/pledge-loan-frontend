// src/pages/AllLoansPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

function AllLoansPage({ userRole, branchId }) {
  const [loans, setLoans] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    const fetchAllLoans = async () => {
        setIsLoading(true);
        setFetchError(null); 
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            const params = {};
            if (branchId && branchId !== 'all') {
                params.branchId = branchId;
            }

            const response = await axios.get(`${API_URL}/api/loans`, { headers, params });
            setLoans(response.data);
        } catch (error) {
            console.error("AllLoansPage: Error fetching all loans:", error); 
            setFetchError("Failed to load loans. Please try again.");
            setLoans([]); 
        } finally {
            setIsLoading(false);
        }
    };

    fetchAllLoans();
  }, [branchId]); 

  const filteredLoans = loans.filter(loan => {
    const statusMatch = filterStatus === 'all' || loan.status === filterStatus;
    if (!statusMatch) return false;
    const term = searchTerm.toLowerCase();
    const nameMatch = loan.customer_name?.toLowerCase().includes(term);
    const phoneMatch = loan.phone_number?.includes(searchTerm);
    const bookMatch = loan.book_loan_number?.toLowerCase().includes(term);
    return nameMatch || phoneMatch || bookMatch;
  });

  if (isLoading) return <div className="text-center mt-5"><div className="spinner-border text-primary"></div></div>;
  if (fetchError) return <div className="alert alert-danger mt-3">{fetchError}</div>;

  const showBranchInfo = userRole === 'admin' && branchId === 'all';

  return (
    <div className="card shadow-sm border-0">
      {/* HEADER: Title & Filters */}
      <div className="card-header bg-white py-3">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3 gap-3">
              <h4 className="mb-0 fw-bold text-dark"><i className="bi bi-files me-2 text-primary"></i>All Loans</h4>
              
              <div className="d-flex align-items-center gap-2">
                  <span className="text-muted small fw-bold text-uppercase">Status:</span>
                  <select
                      className="form-select form-select-sm w-auto fw-bold text-dark"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                  >
                      <option value="all">All Statuses</option>
                      <option value="active">Active</option>
                      <option value="overdue">Overdue</option>
                      <option value="paid">Paid</option>
                      <option value="forfeited">Forfeited</option>
                  </select>
              </div>
          </div>

          <div className="input-group">
            <span className="input-group-text bg-light border-end-0"><i className="bi bi-search text-muted"></i></span>
            <input
              type="text"
              className="form-control border-start-0 bg-light"
              placeholder="Search by customer name, phone, or book loan number..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
      </div>

      {/* SCROLLABLE LIST CONTAINER */}
      <div 
        className="list-group list-group-flush overflow-auto" 
        style={{ maxHeight: '72vh', minHeight: '400px' }}
      >
        {filteredLoans.length === 0 ? (
           <div className="text-center py-5 text-muted">
              <i className="bi bi-inbox fs-1 d-block mb-2 opacity-50"></i>
              No loans found matching your criteria.
           </div>
        ) : (
          filteredLoans.map(loan => (
            <Link key={loan.id} to={`/loans/${loan.id}`} className="list-group-item list-group-item-action py-3 px-4">
              <div className="d-flex w-100 justify-content-between align-items-center mb-2">
                <div>
                   <h6 className="mb-1 fw-bold text-primary">
                      Loan #{loan.book_loan_number || loan.id}
                   </h6>
                   <small className="text-dark fw-500">{loan.customer_name}</small>
                </div>

                <div className="text-end">
                   {showBranchInfo && loan.branch_name && (
                       <div className="badge bg-light text-secondary border mb-1 d-block">
                           {loan.branch_name}
                       </div>
                   )}
                   <span className={`badge rounded-pill ${
                       loan.status === 'overdue' ? 'bg-danger bg-opacity-10 text-danger' :
                       loan.status === 'paid' ? 'bg-secondary bg-opacity-10 text-secondary' :
                       loan.status === 'forfeited' ? 'bg-dark text-white' : 'bg-success bg-opacity-10 text-success'
                   }`}>
                      {loan.status.toUpperCase()}
                   </span>
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-end mt-2">
                  <div>
                    <span className="d-block text-muted small" style={{fontSize: '0.75rem'}}>PRINCIPAL</span>
                    <span className="fw-bold fs-5">₹{parseFloat(loan.principal_amount || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="text-end text-muted small">
                    <div>Pledged: {new Date(loan.pledge_date).toLocaleDateString()}</div>
                    {loan.status !== 'paid' && loan.status !== 'forfeited' && (
                        <div className={loan.status === 'overdue' ? 'text-danger fw-bold' : ''}>
                            Due: {new Date(loan.due_date).toLocaleDateString()}
                        </div>
                    )}
                  </div>
              </div>
            </Link>
          ))
        )}
      </div>

      <div className="card-footer bg-light text-end text-muted small py-2">
          Showing {filteredLoans.length} records
      </div>
    </div>
  );
}

export default AllLoansPage;