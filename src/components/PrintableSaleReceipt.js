import React from 'react';

// Using React.forwardRef is CRITICAL for printing
export const PrintableSaleReceipt = React.forwardRef(({ loan, stats, salePrice, buyerNotes }, ref) => {
  // Safe math defaults
  const principal = parseFloat(stats?.outstandingPrincipal || 0);
  const interest = parseFloat(stats?.totalInterestOwed || 0); 
  const totalDue = principal + interest;
  const price = parseFloat(salePrice || 0);
  const balance = price - totalDue;

  return (
    <div ref={ref} className="p-5" style={{ fontFamily: 'Times New Roman, serif', color: '#000', backgroundColor: '#fff', width: '210mm', minHeight: '297mm', margin: '0 auto' }}>
      {/* Header */}
      <div className="text-center mb-5 border-bottom border-dark pb-3">
        <h2 className="fw-bold mb-1">AUCTION / SALE RECEIPT</h2>
        <p className="mb-0 text-uppercase tracking-wide">Statement of Sale of Pledged Asset</p>
        <small className="text-muted">{new Date().toLocaleString()}</small>
      </div>

      {/* Loan & Item Info */}
      <div className="row mb-5">
        <div className="col-6">
          <h6 className="fw-bold border-bottom border-dark d-inline-block mb-2">LOAN DETAILS</h6>
          <table className="table table-sm table-borderless w-100 small mb-0">
            <tbody>
              <tr><td className="text-muted ps-0" style={{width: '100px'}}>Loan Number:</td><td className="fw-bold">#{loan.book_loan_number}</td></tr>
              <tr><td className="text-muted ps-0">Customer:</td><td>{loan.customer_name}</td></tr>
              <tr><td className="text-muted ps-0">Pledge Date:</td><td>{new Date(loan.pledge_date).toLocaleDateString()}</td></tr>
            </tbody>
          </table>
        </div>
        <div className="col-6">
          <h6 className="fw-bold border-bottom border-dark d-inline-block mb-2">ITEM DETAILS</h6>
          <table className="table table-sm table-borderless w-100 small mb-0">
            <tbody>
              <tr><td className="text-muted ps-0" style={{width: '80px'}}>Item:</td><td>{loan.description}</td></tr>
              <tr><td className="text-muted ps-0">Type:</td><td className="text-uppercase">{loan.item_type}</td></tr>
              <tr><td className="text-muted ps-0">Weight:</td><td>{loan.gross_weight}g / {loan.net_weight}g</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Financial Breakdown */}
      <div className="card border border-dark rounded-0 mb-4">
        <div className="card-header bg-transparent border-bottom border-dark fw-bold text-center">FINANCIAL SETTLEMENT</div>
        <div className="card-body p-0">
          <table className="table table-bordered border-dark mb-0">
            <tbody>
              <tr>
                <td className="p-2 w-50">Outstanding Principal</td>
                <td className="p-2 text-end fw-medium">₹{principal.toFixed(2)}</td>
              </tr>
              <tr>
                <td className="p-2">Accrued Interest</td>
                <td className="p-2 text-end fw-medium">₹{interest.toFixed(2)}</td>
              </tr>
              <tr className="bg-light">
                <td className="p-2 fw-bold">TOTAL AMOUNT DUE</td>
                <td className="p-2 text-end fw-bold">₹{totalDue.toFixed(2)}</td>
              </tr>
              <tr>
                <td className="p-2 fw-bold text-uppercase">Sold For (Sale Price)</td>
                <td className="p-2 text-end fw-bold fs-5">₹{price.toFixed(2)}</td>
              </tr>
              <tr>
                <td className="p-2 fst-italic">
                    {balance >= 0 ? "SURPLUS (To be refunded to Customer)" : "DEFICIT (Loss to Business)"}
                </td>
                <td className={`p-2 text-end fw-bold ${balance >= 0 ? 'text-success' : 'text-danger'}`}>
                    {balance >= 0 ? '+' : ''}₹{balance.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes Section */}
      <div className="mb-5 border border-dark p-3 rounded-0" style={{minHeight: '100px'}}>
        <span className="fw-bold small d-block mb-1 text-decoration-underline">SALE REMARKS / BUYER DETAILS:</span>
        <p className="mb-0 small" style={{whiteSpace: 'pre-wrap'}}>{buyerNotes || "No additional notes."}</p>
      </div>

      {/* Signatures */}
      <div className="row mt-5 pt-5">
        <div className="col-6 text-center">
            <div className="border-top border-dark w-75 mx-auto pt-2">Authorized Signatory</div>
        </div>
        <div className="col-6 text-center">
            <div className="border-top border-dark w-75 mx-auto pt-2">Buyer / Witness Signature</div>
        </div>
      </div>
      
      <div className="text-center position-absolute bottom-0 start-0 w-100 pb-4 small text-muted">
        <p>This document is an official record of the forfeiture/sale of the pledged asset.</p>
      </div>
    </div>
  );
});