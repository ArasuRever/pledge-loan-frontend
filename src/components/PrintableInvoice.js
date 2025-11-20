// src/components/PrintableInvoice.js
import React from 'react';

export const PrintableInvoice = React.forwardRef(({ loanDetails }, ref) => {
  // A4 dimensions in mm: 210 x 297
  // We use a fixed width container to ensure PDF looks exactly like this.
  const containerStyle = {
    width: '210mm',
    minHeight: '297mm',
    padding: '15mm',
    backgroundColor: 'white',
    fontFamily: 'Times New Roman, serif',
    color: '#000',
    boxSizing: 'border-box',
    position: 'relative',
    fontSize: '11pt',
  };

  // Styles
  const headerTitle = { fontSize: '20pt', fontWeight: 'bold', textAlign: 'center', textTransform: 'uppercase', marginBottom: '5px' };
  const headerSub = { fontSize: '10pt', textAlign: 'center', marginBottom: '2px' };
  const docTitle = { fontSize: '14pt', fontWeight: 'bold', textAlign: 'center', textDecoration: 'underline', marginTop: '15px', marginBottom: '20px' };

  const tableStyle = { width: '100%', borderCollapse: 'collapse', marginBottom: '10px' };
  const tdLabel = { fontWeight: 'bold', width: '35%', padding: '4px', verticalAlign: 'top' };
  const tdValue = { padding: '4px', verticalAlign: 'top' };
  
  const borderBox = { border: '1px solid #000', padding: '10px', height: '100%' };
  
  const itemsTable = { width: '100%', borderCollapse: 'collapse', marginTop: '20px' };
  const itemTh = { border: '1px solid #000', backgroundColor: '#eee', padding: '8px', fontSize: '10pt', textAlign: 'center' };
  const itemTd = { border: '1px solid #000', padding: '8px', textAlign: 'center' };

  if (!loanDetails) return <div ref={ref}>Loading Data...</div>;

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '-';
  const formatMoney = (m) => `Rs. ${parseFloat(m || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  return (
    <div ref={ref} style={containerStyle}>
      
      {/* HEADER */}
      <div style={{marginBottom: '10px'}}>
        <div style={headerTitle}>SRI KUBERA BANKERS</div>
        <div style={headerSub}>123 Main Bazaar, Salem, Tamil Nadu - 636001</div>
        <div style={headerSub}>Phone: 9876543210</div>
      </div>
      
      <div style={{borderBottom: '2px solid #000', marginBottom: '10px'}}></div>
      
      <div style={docTitle}>PLEDGE TICKET / LOAN RECEIPT</div>

      {/* TWO COLUMN LAYOUT USING TABLE */}
      <table style={{width: '100%', marginBottom: '20px'}}>
        <tbody>
          <tr>
            {/* LEFT: LOAN DETAILS */}
            <td style={{width: '50%', paddingRight: '10px', verticalAlign: 'top'}}>
              <div style={borderBox}>
                <div style={{fontWeight: 'bold', textDecoration: 'underline', marginBottom: '10px'}}>LOAN DETAILS</div>
                <table style={tableStyle}>
                  <tbody>
                    <tr><td style={tdLabel}>Loan No:</td><td style={tdValue}>{loanDetails.book_loan_number || loanDetails.id}</td></tr>
                    <tr><td style={tdLabel}>Date:</td><td style={tdValue}>{formatDate(loanDetails.pledge_date)}</td></tr>
                    <tr><td style={tdLabel}>Principal:</td><td style={tdValue}>{formatMoney(loanDetails.principal_amount)}</td></tr>
                    <tr><td style={tdLabel}>Interest:</td><td style={tdValue}>{loanDetails.interest_rate}% p.m.</td></tr>
                    <tr><td style={tdLabel}>Due Date:</td><td style={tdValue}>{formatDate(loanDetails.due_date)}</td></tr>
                  </tbody>
                </table>
              </div>
            </td>

            {/* RIGHT: CUSTOMER DETAILS */}
            <td style={{width: '50%', paddingLeft: '10px', verticalAlign: 'top'}}>
              <div style={borderBox}>
                <div style={{fontWeight: 'bold', textDecoration: 'underline', marginBottom: '10px'}}>CUSTOMER DETAILS</div>
                <table style={tableStyle}>
                  <tbody>
                    <tr><td style={tdLabel}>Name:</td><td style={tdValue}>{loanDetails.customer_name}</td></tr>
                    <tr><td style={tdLabel}>Phone:</td><td style={tdValue}>{loanDetails.phone_number}</td></tr>
                    <tr><td style={tdLabel}>Address:</td><td style={tdValue}>{loanDetails.address || 'N/A'}</td></tr>
                    {loanDetails.id_proof_number && (
                        <tr><td style={tdLabel}>ID Proof:</td><td style={tdValue}>{loanDetails.id_proof_type} - {loanDetails.id_proof_number}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ITEMS TABLE */}
      <div style={{fontWeight: 'bold', textDecoration: 'underline'}}>PARTICULARS OF PLEDGED ARTICLES:</div>
      <table style={itemsTable}>
        <thead>
          <tr>
            <th style={itemTh}>Description</th>
            <th style={itemTh}>Gross Wt</th>
            <th style={itemTh}>Net Wt</th>
            <th style={itemTh}>Purity</th>
            <th style={itemTh}>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{...itemTd, textAlign: 'left'}}>{loanDetails.description} <br/><small>({loanDetails.item_type})</small></td>
            <td style={itemTd}>{loanDetails.gross_weight || loanDetails.weight || '-'} g</td>
            <td style={itemTd}>{loanDetails.net_weight || '-'} g</td>
            <td style={itemTd}>{loanDetails.purity || '-'}</td>
            <td style={itemTd}>{formatMoney(loanDetails.appraised_value)}</td>
          </tr>
        </tbody>
      </table>

      {/* TERMS */}
      <div style={{marginTop: '30px', border: '1px solid #ccc', padding: '10px', fontSize: '10pt'}}>
        <strong>Declaration & Terms:</strong>
        <ol style={{paddingLeft: '20px', marginTop: '5px'}}>
          <li>I acknowledge receipt of the principal amount mentioned above.</li>
          <li>I declare that I am the absolute owner of the pledged articles and they are free from any encumbrance.</li>
          <li>If interest is unpaid for 12 months, the lender has the right to auction the articles after due notice.</li>
          <li>The net weight is approximate after deducting stone/dust/enamel weight.</li>
        </ol>
      </div>

      {/* SIGNATURES */}
      <div style={{marginTop: '60px', display: 'flex', justifyContent: 'space-between'}}>
        <div style={{textAlign: 'center', width: '40%'}}>
          <div style={{borderTop: '1px solid #000', paddingTop: '5px'}}>Signature of Borrower</div>
        </div>
        <div style={{textAlign: 'center', width: '40%'}}>
          <div style={{borderTop: '1px solid #000', paddingTop: '5px'}}>For SRI KUBERA BANKERS</div>
          <div style={{fontSize: '9pt'}}>(Authorized Signatory)</div>
        </div>
      </div>
      
      <div style={{position: 'absolute', bottom: '15mm', left: '0', width: '100%', textAlign: 'center', fontSize: '8pt', color: '#888'}}>
        Computer Generated Invoice
      </div>

    </div>
  );
});