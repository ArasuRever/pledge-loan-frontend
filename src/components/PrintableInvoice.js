import React from 'react';

// Use React.forwardRef and a NAMED export (export const)
export const PrintableInvoice = React.forwardRef(({ loanDetails }, ref) => {
  
  const tableStyle = { width: '100%', borderCollapse: 'collapse', marginTop: '20px' };
  const thStyle = { border: '1px solid black', padding: '8px', textAlign: 'left', backgroundColor: '#eee' };
  const tdStyle = { border: '1px solid black', padding: '8px' };

  if (!loanDetails) {
    return null;
  }

  return (
    <div ref={ref} style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2 style={{ textAlign: 'center', borderBottom: '2px solid black', paddingBottom: '10px' }}>
        PLEDGE INVOICE / RECEIPT
      </h2>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
        <div>
          <h4>Loan #{loanDetails.id}</h4>
          <p><strong>Book Loan #:</strong> {loanDetails.book_loan_number}</p>
        </div>
        <div>
          <p><strong>Date:</strong> {new Date(loanDetails.pledge_date).toLocaleDateString()}</p>
          <p><strong>Due Date:</strong> {new Date(loanDetails.due_date).toLocaleDateString()}</p>
        </div>
      </div>

      <hr />

      <h4>Customer Details</h4>
      <p>
        <strong>Name:</strong> {loanDetails.customer_name}<br />
        <strong>Phone:</strong> {loanDetails.phone_number}
      </p>

      <hr />

      <h4>Loan Details</h4>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Principal Amount</th>
            <th style={thStyle}>Interest Rate</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={tdStyle}>₹{parseFloat(loanDetails.principal_amount).toLocaleString('en-IN')}</td>
            <td style={tdStyle}>{loanDetails.interest_rate}%</td>
          </tr>
        </tbody>
      </table>

      <h4 style={{ marginTop: '20px' }}>Pledged Item(s)</h4>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Description</th>
            <th style={thStyle}>Type</th>
            <th style={thStyle}>Quality</th>
            <th style={{...thStyle, textAlign: 'right'}}>Weight (g)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={tdStyle}>{loanDetails.description}</td>
            <td style={tdStyle}>{loanDetails.item_type}</td>
            <td style={tdStyle}>{loanDetails.quality}</td>
            <td style={{...tdStyle, textAlign: 'right'}}>{loanDetails.weight}g</td>
          </tr>
        </tbody>
      </table>

      <div style={{ marginTop: '50px' }}>
        <p>Customer Signature: _________________________</p>
        <br />
        <p>Manager Signature: _________________________</p>
      </div>
      
      <p style={{ marginTop: '20px', fontSize: '12px', textAlign: 'center' }}>
        Thank you for your business. | PledgeManager
      </p>
    </div>
  );
});