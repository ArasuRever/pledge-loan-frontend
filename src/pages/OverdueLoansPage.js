// src/pages/OverdueLoansPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import NoticeModal from '../components/NoticeModal'; 

const API_URL = process.env.REACT_APP_API_URL;

const OverdueLoansPage = () => {
  const navigate = useNavigate();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State for the modal
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);

  useEffect(() => {
    const fetchOverdueLoans = async () => {
      try {
        // 1. Get the token
        const token = localStorage.getItem('token');
        
        // 2. Add Cache Buster
        const cacheBuster = Date.now();
        const url = `${API_URL}/api/loans/overdue?t=${cacheBuster}`;
        
        // 3. Send Request with Headers
        const response = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${token}` // <--- FIXED: Added Auth Header
            }
        });
        
        setLoans(response.data);
      } catch (err) {
        console.error("Error fetching overdue loans:", err);
        // Optional: Redirect to login if unauthorized
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
            navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchOverdueLoans();
  }, [navigate]);

  const getDaysOverdue = (dueDate) => {
      const due = new Date(dueDate);
      const today = new Date();
      const diffTime = Math.abs(today - due);
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleNoticeClick = (e, loan) => {
      e.stopPropagation(); 
      setSelectedLoan(loan);
      setShowNoticeModal(true);
  };

  if (loading) return <div className="text-center mt-5"><div className="spinner-border text-primary"></div></div>;

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
         <h3 className="text-danger fw-bold"><i className="bi bi-exclamation-triangle-fill me-2"></i>Overdue Loans</h3>
         <span className="badge bg-danger fs-6">{loans.length} Records</span>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-danger text-uppercase small">
                <tr>
                  <th>Loan #</th>
                  <th>Customer</th>
                  <th>Principal</th>
                  <th>Due Date</th>
                  <th>Overdue By</th>
                  <th className="text-end pe-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {loans.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-5 text-muted">No overdue loans.</td></tr>
                ) : (
                  loans.map(loan => {
                    const days = getDaysOverdue(loan.due_date);
                    return (
                        <tr 
                            key={loan.id} 
                            style={{cursor: 'pointer'}} 
                            onClick={() => navigate(`/loans/${loan.id}`)}
                        >
                            <td className="fw-bold text-primary">{loan.book_loan_number}</td>
                            <td>{loan.customer_name}</td>
                            <td className="fw-bold">₹{parseFloat(loan.principal_amount).toFixed(2)}</td>
                            <td className="text-danger fw-medium">{new Date(loan.due_date).toLocaleDateString('en-IN')}</td>
                            <td>
                                <span className={`badge ${days > 90 ? 'bg-danger' : 'bg-warning text-dark'}`}>
                                    {days} Days
                                </span>
                            </td>
                            <td className="text-end pe-4">
                                <button 
                                    className="btn btn-sm btn-dark" 
                                    onClick={(e) => handleNoticeClick(e, loan)}
                                >
                                    <i className="bi bi-pencil-square me-1"></i> Notice
                                </button>
                            </td>
                        </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <NoticeModal 
        show={showNoticeModal} 
        onClose={() => setShowNoticeModal(false)} 
        loan={selectedLoan} 
      />

    </div>
  );
};

export default OverdueLoansPage;