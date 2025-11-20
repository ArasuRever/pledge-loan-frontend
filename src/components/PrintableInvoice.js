// src/components/PrintableInvoice.js
import React from 'react';

export const PrintableInvoice = React.forwardRef(({ loanDetails }, ref) => {
  // Styles
  const containerStyle = { padding: '15mm', fontFamily: 'Times New Roman, serif', fontSize: '11pt', color: '#000', lineHeight: '1.4' };
  const headerStyle = { textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid #000', paddingBottom: '10px' };
  const titleStyle = { fontSize: '16pt', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' };
  const subTitleStyle = { fontSize: '10pt', marginTop: '5px' };
  
  const gridStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' };
  const boxStyle = { border: '1px solid #000', padding: '8px' };
  const labelStyle = { fontWeight: 'bold', fontSize: '9pt', display: 'block', marginBottom: '2px' };
  
  const tableStyle = { width: '100%', borderCollapse: 'collapse', marginTop: '10px', marginBottom: '10px', fontSize: '10pt' };
  const thStyle = { border: '1px solid black', padding: '4px', textAlign: 'center', backgroundColor: '#f0f0f0', fontWeight: 'bold' };
  const tdStyle = { border: '1px solid black', padding: '4px', textAlign: 'center' };

  const declarationStyle = { fontSize: '9pt', textAlign: 'justify', marginTop: '10px', fontStyle: 'italic' };
  const signatureRow = { display: 'flex', justifyContent: 'space-between', marginTop: '50px', paddingTop: '10px' };
  const signatureLine = { borderTop: '1px solid black', width: '40%', textAlign: 'center', fontSize: '10pt' };

  if (!loanDetails) return <div ref={ref}>Loading...</div>;

  const formatDate = (d) => new Date(d).toLocaleDateString('en-GB');
  const formatMoney = (m) => `₹${parseFloat(m || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  return (
    <div ref={ref} style={containerStyle}>
      {/* HEADER */}
      <div style={headerStyle}>
        <div style={titleStyle}>SRI KUBERA BANKERS</div>
        <div style={subTitleStyle}>123 Main Bazaar, Salem, Tamil Nadu - 636001 | Phone: 9876543210</div>
        <div style={{...subTitleStyle, fontWeight: 'bold', marginTop: '8px'}}>PLEDGE TICKET / LOAN RECEIPT</div>
      </div>

      {/* INFO GRID */}
      <div style={gridStyle}>
        <div style={boxStyle}>
          <span style={labelStyle}>LOAN DETAILS:</span>
          <div><strong>Loan No:</strong> {loanDetails.book_loan_number || loanDetails.id}</div>
          <div><strong>Date:</strong> {formatDate(loanDetails.pledge_date)}</div>
          <div><strong>Amount:</strong> {formatMoney(loanDetails.principal_amount)}</div>
          <div><strong>Interest:</strong> {loanDetails.interest_rate}% p.m.</div>
        </div>
        <div style={boxStyle}>
          <span style={labelStyle}>CUSTOMER DETAILS:</span>
          <div><strong>Name:</strong> {loanDetails.customer_name}</div>
          <div><strong>Phone:</strong> {loanDetails.phone_number}</div>
          <div><strong>Address:</strong> {loanDetails.address}</div>
        </div>
      </div>

      {/* ITEM TABLE */}
      <strong style={{textDecoration: 'underline'}}>PARTICULARS OF PLEDGED ARTICLES:</strong>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Description</th>
            <th style={thStyle}>Type</th>
            <th style={thStyle}>Gross Wt (g)</th>
            <th style={thStyle}>Net Wt (g)</th>
            <th style={thStyle}>Purity</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{...tdStyle, textAlign: 'left'}}>{loanDetails.description}</td>
            <td style={tdStyle}>{loanDetails.item_type}</td>
            <td style={tdStyle}>{loanDetails.gross_weight || loanDetails.weight || '-'}</td>
            <td style={tdStyle}>{loanDetails.net_weight || '-'}</td>
            <td style={tdStyle}>{loanDetails.purity || '-'}</td>
          </tr>
        </tbody>
      </table>

      {/* DECLARATION */}
      <div style={declarationStyle}>
        <p><strong>Terms & Declaration:</strong></p>
        <ol style={{paddingLeft: '20px', margin: '5px 0'}}>
          <li>I am the absolute owner of the articles pledged above and they are free from any encumbrance.</li>
          <li>I agree to pay the interest as mentioned above. If the interest is not paid for more than 12 months, the lender has the right to auction the pledged articles after due notice.</li>
          <li>The net weight mentioned is approximate after deducting stone/dust weight.</li>
          <li>I have received the principal amount in cash/bank transfer.</li>
        </ol>
      </div>

      {/* SIGNATURES */}
      <div style={signatureRow}>
        <div style={signatureLine}>
          Signature of Borrower
        </div>
        <div style={signatureLine}>
          For SRI KUBERA BANKERS
          <br/><br/>
          (Authorized Signatory)
        </div>
      </div>
    </div>
  );
});