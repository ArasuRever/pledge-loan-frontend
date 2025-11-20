// src/pages/OverdueLoansPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import { useNavigate } from 'react-router-dom';

export const OverdueLoansPage = () => {
  const API_URL = process.env.REACT_APP_API_URL;
  const navigate = useNavigate();

  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // --- Modal State ---
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);

  useEffect(() => {
    const fetchOverdue = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/loans/overdue`);
        setLoans(res.data);
      } catch (err) {
        console.error("Error fetching overdue loans:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOverdue();
  }, [API_URL]);

  // --- NOTICE GENERATOR (Core Logic) ---
  const generateNoticePDF = (loan, action = 'save') => {
    const doc = new jsPDF();
    
    // Header - Centered
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("SRI KUBERA BANKERS", 105, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("123 Main Bazaar, Salem, Tamil Nadu - 636001 | Phone: 9876543210", 105, 26, { align: "center" });
    
    // Horizontal Line
    doc.setLineWidth(0.5);
    doc.line(10, 30, 200, 30);

    // Title - Centered and Bold
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("FINAL NOTICE / AUCTION WARNING", 105, 45, { align: "center" });

    // Date - Right Aligned
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const currentDate = new Date().toLocaleDateString('en-GB'); // DD/MM/YYYY format
    doc.text(`Date: ${currentDate}`, 190, 55, { align: "right" });

    // To Address - Left Aligned
    doc.text("To,", 15, 65);
    doc.setFont("helvetica", "bold");
    doc.text(loan.customer_name, 15, 71);
    doc.setFont("helvetica", "normal");
    
    // Use actual address or fallback
    const addressText = loan.address ? loan.address : "(Address as per records)";
    // Split address into multiple lines if it's long (max width 80mm)
    const addressLines = doc.splitTextToSize(addressText, 80);
    doc.text(addressLines, 15, 77);
    
    // Subject - Centered/Indented slightly
    const subjectY = 77 + (addressLines.length * 5) + 10;
    doc.setFont("helvetica", "bold");
    doc.text(`Sub: Non-payment of Loan #${loan.book_loan_number} - Pledge Auction Notice`, 15, subjectY);

    // Body Content
    doc.setFont("helvetica", "normal");
    const pledgeDate = new Date(loan.pledge_date).toLocaleDateString('en-GB');
    const dueDate = new Date(loan.due_date).toLocaleDateString('en-GB');
    const principal = parseFloat(loan.principal_amount).toFixed(2);
    
    const startY = subjectY + 10;
    
    // Dear Sir/Madam
    doc.text("Dear Sir/Madam,", 15, startY);

    // Loan Details Block
    doc.text(`Ref Loan No: ${loan.book_loan_number}`, 15, startY + 10);
    doc.text(`Pledged Date: ${pledgeDate}`, 70, startY + 10); 
    doc.text(`Principal Amount: Rs. ${principal}`, 15, startY + 16);

    // Main Paragraphs
    const para1 = `This is to inform you that the above-mentioned loan is overdue. Despite multiple reminders, the interest and principal amount remain unpaid. The loan was due on ${dueDate}.`;
    const para2 = `You are hereby requested to settle the total outstanding dues including interest within 7 days from the receipt of this notice.`;
    const para3 = `Failing which, we will be constrained to auction the pledged ornaments/articles to recover our dues without further notice. You will be held liable for any shortfall and costs incurred.`;
    const para4 = `Please treat this as urgent.`;

    const splitPara1 = doc.splitTextToSize(para1, 180);
    const splitPara2 = doc.splitTextToSize(para2, 180);
    const splitPara3 = doc.splitTextToSize(para3, 180);
    
    let currentY = startY + 26;
    
    doc.text(splitPara1, 15, currentY);
    currentY += (splitPara1.length * 5) + 5;
    
    doc.text(splitPara2, 15, currentY);
    currentY += (splitPara2.length * 5) + 5;
    
    doc.text(splitPara3, 15, currentY);
    currentY += (splitPara3.length * 5) + 10;
    
    doc.text(para4, 15, currentY);

    // Footer / Signature
    const signatureY = currentY + 30;
    doc.text("For SRI KUBERA BANKERS", 150, signatureY, { align: "center" });
    doc.text("(Manager)", 150, signatureY + 15, { align: "center" });

    // --- ACTION HANDLER ---
    if (action === 'print') {
        doc.autoPrint();
        window.open(doc.output('bloburl'), '_blank');
    } else {
        doc.save(`Notice_${loan.book_loan_number}.pdf`);
    }
    
    // Close modal after action
    setShowNoticeModal(false);
    setSelectedLoan(null);
  };

  // Helper: Calculate Days Overdue
  const getDaysOverdue = (dueDate) => {
      const due = new Date(dueDate);
      const today = new Date();
      const diffTime = Math.abs(today - due);
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Handler to open modal
  const handleNoticeClick = (e, loan) => {
      e.stopPropagation(); // Prevent row click
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
                  <tr><td colSpan="6" className="text-center py-5 text-muted">No overdue loans. Good job!</td></tr>
                ) : (
                  loans.map(loan => {
                    const days = getDaysOverdue(loan.due_date);
                    return (
                        // --- ROW CLICKABLE TO LOAN DETAILS ---
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
                                {/* --- BUTTON OPENS MODAL (Stops Propagation) --- */}
                                <button 
                                    className="btn btn-sm btn-dark"
                                    onClick={(e) => handleNoticeClick(e, loan)}
                                >
                                    <i className="bi bi-envelope-paper me-1"></i> Notice
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

      {/* --- NOTICE ACTION MODAL --- */}
      {showNoticeModal && selectedLoan && (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050, display: 'flex', 
            justifyContent: 'center', alignItems: 'center'
        }}>
          <div className="bg-white rounded shadow-lg p-4" style={{width: '400px'}}>
            <h5 className="mb-3 fw-bold">Generate Legal Notice</h5>
            <p className="text-muted mb-4">
                Create an auction warning notice for <strong>{selectedLoan.customer_name}</strong> (Loan #{selectedLoan.book_loan_number})?
            </p>
            
            <div className="d-grid gap-2">
                <button 
                    className="btn btn-primary" 
                    onClick={() => generateNoticePDF(selectedLoan, 'print')}
                >
                    <i className="bi bi-printer-fill me-2"></i> Print Notice
                </button>
                <button 
                    className="btn btn-outline-success" 
                    onClick={() => generateNoticePDF(selectedLoan, 'save')}
                >
                    <i className="bi bi-download me-2"></i> Download PDF
                </button>
                <button 
                    className="btn btn-light mt-2" 
                    onClick={() => setShowNoticeModal(false)}
                >
                    Cancel
                </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default OverdueLoansPage;