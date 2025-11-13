import React from 'react';

// Use React.forwardRef and a NAMED export
export const PrintableInvoice = React.forwardRef(({ loanDetails }, ref) => {

  // Inline styles for printing - helps maintain layout across print/PDF
  const containerStyle = { padding: '20mm', fontFamily: 'Arial, sans-serif', fontSize: '10pt', color: '#000' };
  const headerStyle = { textAlign: 'center', borderBottom: '2px solid black', paddingBottom: '10px', marginBottom: '15px' };
  const flexBetween = { display: 'flex', justifyContent: 'space-between', marginTop: '15px', marginBottom: '15px' };
  const sectionTitleStyle = { marginTop: '15px', marginBottom: '5px', borderBottom: '1px solid #ccc', paddingBottom: '3px' };
  const hrStyle = { border: 0, borderTop: '1px dashed #ccc', margin: '15px 0' };
  const tableStyle = { width: '100%', borderCollapse: 'collapse', marginTop: '10px', fontSize: '9pt' };
  const thStyle = { border: '1px solid black', padding: '6px', textAlign: 'left', backgroundColor: '#eee', fontWeight: 'bold' };
  const tdStyle = { border: '1px solid black', padding: '6px' };
  const signatureSection = { marginTop: '40px', paddingTop: '20px', borderTop: '1px dashed #ccc' };
  const footerStyle = { marginTop: '20px', fontSize: '8pt', textAlign: 'center', color: '#555' };

  // Handle case where data might not be ready yet (though LoanPage should ensure it is)
  if (!loanDetails) {
    return <div ref={ref}>Loading invoice data...</div>;
  }

  // Format currency consistently
  const formatCurrency = (amount) => {
      const num = parseFloat(amount);
      if (isNaN(num)) return '₹ --';
      return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Format dates consistently
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-GB'); // dd/mm/yyyy format
    } catch (e) {
      return 'Invalid Date';
    }
  };

  return (
    // Use the ref on the outermost div that contains everything to be printed/captured
    <div ref={ref} style={containerStyle}>
      <h2 style={headerStyle}>
        PLEDGE INVOICE / RECEIPT
      </h2>

      <div style={flexBetween}>
        <div>
          <h4>Loan #{loanDetails.id}</h4>
          <p style={{ margin: '2px 0' }}><strong>Book Loan #:</strong> {loanDetails.book_loan_number || 'N/A'}</p>
        </div>
        <div>
          <p style={{ margin: '2px 0' }}><strong>Date:</strong> {formatDate(loanDetails.pledge_date)}</p>
          <p style={{ margin: '2px 0' }}><strong>Due Date:</strong> {formatDate(loanDetails.due_date)}</p>
        </div>
      </div>

      <hr style={hrStyle} />

      <h4 style={sectionTitleStyle}>Customer Details</h4>
      <p style={{ margin: '2px 0' }}>
        <strong>Name:</strong> {loanDetails.customer_name}<br />
        <strong>Phone:</strong> {loanDetails.phone_number}<br/>
        {loanDetails.address && <><strong>Address:</strong> {loanDetails.address}<br/></>}
      </p>

      <hr style={hrStyle} />

      <h4 style={sectionTitleStyle}>Loan Details</h4>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Principal Amount</th>
            <th style={thStyle}>Interest Rate (p.a.)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={tdStyle}>{formatCurrency(loanDetails.principal_amount)}</td>
            <td style={tdStyle}>{loanDetails.interest_rate}%</td>
          </tr>
        </tbody>
      </table>

      <h4 style={sectionTitleStyle}>Pledged Item(s)</h4>
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
            <td style={tdStyle}>{loanDetails.description || 'N/A'}</td>
            <td style={tdStyle}>{loanDetails.item_type || 'N/A'}</td>
            <td style={tdStyle}>{loanDetails.quality || 'N/A'}</td>
            <td style={{...tdStyle, textAlign: 'right'}}>{loanDetails.weight ? `${loanDetails.weight}g` : 'N/A'}</td>
          </tr>
        </tbody>
      </table>

      <div style={signatureSection}>
        <p>Customer Signature: _________________________</p>
        <br />
        <p>Manager Signature: _________________________</p>
      </div>

      <p style={footerStyle}>
        Thank you for your business. | PledgeManager
      </p>
    </div>
  );
});