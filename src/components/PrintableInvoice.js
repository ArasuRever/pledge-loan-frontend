// src/components/PrintableInvoice.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable'; // Ensure this is installed or use manual table logic if simple

const API_URL = process.env.REACT_APP_API_URL;

export const PrintableInvoice = ({ loanDetails }) => {
  const [settings, setSettings] = useState({
    business_name: 'SRI KUBERA BANKERS',
    address: '123 Main Bazaar, Salem',
    phone_number: '',
    license_number: '',
    logo_url: null
  });

  // --- 1. FETCH BUSINESS SETTINGS ---
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const res = await axios.get(`${API_URL}/api/settings`, { headers });
        if (res.data) {
          setSettings({
            business_name: res.data.business_name || 'SRI KUBERA BANKERS',
            address: res.data.address || '',
            phone_number: res.data.phone_number || '',
            license_number: res.data.license_number || '',
            logo_url: res.data.logo_url || null
          });
        }
      } catch (err) {
        console.error("Error fetching settings:", err);
      }
    };
    fetchSettings();
  }, []);

  if (!loanDetails) return <div className="p-5 text-center">Loading Invoice Data...</div>;

  // Helpers
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '-';
  const formatMoney = (m) => `Rs. ${parseFloat(m || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  // --- 2. GENERATE ENGLISH PDF (Downloadable) ---
  const generateEnglishPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // --- Header with Logo ---
    if (settings.logo_url) {
        try {
            doc.addImage(settings.logo_url, 'PNG', 15, 10, 25, 25);
        } catch (e) { console.warn("Logo error", e); }
    }

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(settings.business_name.toUpperCase(), pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(settings.address, pageWidth / 2, 26, { align: 'center' });
    doc.text(`Phone: ${settings.phone_number} ${settings.license_number ? `| Lic: ${settings.license_number}` : ''}`, pageWidth / 2, 31, { align: 'center' });

    doc.setLineWidth(0.5);
    doc.line(10, 38, 200, 38);

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("PLEDGE TICKET / LOAN RECEIPT", pageWidth / 2, 48, { align: 'center' });

    // --- Two Column Layout (Loan & Customer) ---
    const startY = 55;
    const colWidth = 85;
    
    // Left Box (Loan)
    doc.setDrawColor(0);
    doc.rect(15, startY, colWidth, 45);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("LOAN DETAILS", 18, startY + 6);
    doc.line(15, startY + 8, 15 + colWidth, startY + 8);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    let ly = startY + 14;
    doc.text(`Loan No: ${loanDetails.book_loan_number || loanDetails.id}`, 18, ly);
    doc.text(`Date: ${formatDate(loanDetails.pledge_date)}`, 18, ly + 6);
    doc.text(`Principal: ${formatMoney(loanDetails.principal_amount)}`, 18, ly + 12);
    doc.text(`Interest: ${loanDetails.interest_rate}% per month`, 18, ly + 18);
    doc.text(`Due Date: ${formatDate(loanDetails.due_date)}`, 18, ly + 24);

    // Right Box (Customer)
    doc.rect(110, startY, colWidth, 45);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("CUSTOMER DETAILS", 113, startY + 6);
    doc.line(110, startY + 8, 110 + colWidth, startY + 8);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    ly = startY + 14;
    doc.text(`Name: ${loanDetails.customer_name}`, 113, ly);
    doc.text(`Phone: ${loanDetails.phone_number}`, 113, ly + 6);
    
    const addressLines = doc.splitTextToSize(`Address: ${loanDetails.address || 'N/A'}`, colWidth - 5);
    doc.text(addressLines, 113, ly + 12);
    
    // --- Items Table ---
    const tableY = startY + 55;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("PARTICULARS OF PLEDGED ARTICLES:", 15, tableY);

    // Simple Table Header
    const ty = tableY + 5;
    doc.setFillColor(230, 230, 230);
    doc.rect(15, ty, 180, 8, 'F');
    doc.rect(15, ty, 180, 8, 'S'); // Border
    
    doc.setFontSize(9);
    doc.text("DESCRIPTION", 18, ty + 5);
    doc.text("GROSS WT", 90, ty + 5);
    doc.text("NET WT", 120, ty + 5);
    doc.text("PURITY", 150, ty + 5);
    doc.text("VALUE", 175, ty + 5);

    // Table Row
    const ry = ty + 8;
    doc.rect(15, ry, 180, 12);
    doc.setFont("helvetica", "normal");
    doc.text(`${loanDetails.description} (${loanDetails.item_type})`, 18, ry + 7);
    doc.text(`${loanDetails.gross_weight || loanDetails.weight || '-'} g`, 90, ry + 7);
    doc.text(`${loanDetails.net_weight || '-'} g`, 120, ry + 7);
    doc.text(`${loanDetails.purity || '-'}`, 150, ry + 7);
    doc.text(`${formatMoney(loanDetails.appraised_value)}`, 175, ry + 7);

    // --- Terms ---
    const termsY = ry + 20;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Declaration & Terms:", 15, termsY);
    doc.setFont("helvetica", "normal");
    const terms = [
        "1. I acknowledge receipt of the principal amount mentioned above.",
        "2. I declare that I am the absolute owner of these articles.",
        "3. If interest is unpaid for 12 months, the lender can auction the articles.",
        "4. Net weight is approximate after deducting stone/enamel weight."
    ];
    let termY = termsY + 5;
    terms.forEach(t => {
        doc.text(t, 15, termY);
        termY += 5;
    });

    // --- Signatures ---
    const sigY = termY + 25;
    doc.line(15, sigY, 70, sigY);
    doc.text("Signature of Borrower", 42, sigY + 5, {align: 'center'});

    doc.line(130, sigY, 195, sigY);
    doc.text(`For ${settings.business_name}`, 162, sigY + 5, {align: 'center'});
    doc.text("(Authorized Signatory)", 162, sigY + 10, {align: 'center'});

    doc.save(`Invoice_${loanDetails.book_loan_number}.pdf`);
  };

  // --- 3. GENERATE TAMIL PRINT (Browser Print) ---
  const generateTamilPrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return alert("Please allow popups.");

    const logoImg = settings.logo_url ? `<img src="${settings.logo_url}" style="height:60px; float:left; margin-right:15px;">` : '';

    const html = `
      <html>
      <head>
        <title>Pledge Receipt - Tamil</title>
        <style>
          body { font-family: 'Arial Unicode MS', 'Latha', sans-serif; padding: 30px; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px; overflow: hidden; }
          .header h1 { margin: 0; font-size: 24px; text-transform: uppercase; }
          .header p { margin: 2px 0; font-size: 14px; }
          .title { text-align: center; font-weight: bold; font-size: 18px; text-decoration: underline; margin-bottom: 20px; }
          
          .box-container { display: flex; justify-content: space-between; gap: 20px; margin-bottom: 20px; }
          .box { border: 1px solid #000; padding: 10px; flex: 1; }
          .box-title { font-weight: bold; text-decoration: underline; margin-bottom: 10px; font-size: 14px; }
          table.details { width: 100%; font-size: 13px; }
          table.details td { padding: 3px; vertical-align: top; }
          .label { font-weight: bold; width: 40%; }

          table.items { width: 100%; border-collapse: collapse; margin-top: 10px; }
          table.items th { border: 1px solid #000; background: #eee; padding: 5px; font-size: 12px; }
          table.items td { border: 1px solid #000; padding: 5px; text-align: center; font-size: 13px; }

          .terms { margin-top: 20px; font-size: 12px; border: 1px solid #ccc; padding: 10px; }
          .signatures { margin-top: 60px; display: flex; justify-content: space-between; }
          .sig-box { text-align: center; width: 40%; border-top: 1px solid #000; padding-top: 5px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="display: inline-block; text-align: left;">
             ${logoImg}
          </div>
          <div style="display: inline-block; vertical-align: top;">
             <h1>ஸ்ரீ குபேர லட்சுமி பாங்கர்ஸ்</h1>
             <p>${settings.address}</p>
             <p>போன்: ${settings.phone_number}</p>
          </div>
        </div>

        <div class="title">அடகு ரசீது</div>

        <div class="box-container">
          <div class="box">
            <div class="box-title">கடன் விவரங்கள்</div>
            <table class="details">
              <tr><td class="label">கடன் எண்:</td><td>${loanDetails.book_loan_number}</td></tr>
              <tr><td class="label">தேதி:</td><td>${formatDate(loanDetails.pledge_date)}</td></tr>
              <tr><td class="label">அசல்:</td><td>${formatMoney(loanDetails.principal_amount)}</td></tr>
              <tr><td class="label">வட்டி:</td><td>${loanDetails.interest_rate}% (மாதம்)</td></tr>
              <tr><td class="label">கெடு தேதி:</td><td>${formatDate(loanDetails.due_date)}</td></tr>
            </table>
          </div>
          <div class="box">
            <div class="box-title">வாடிக்கையாளர் விவரங்கள்</div>
            <table class="details">
              <tr><td class="label">பெயர்:</td><td>${loanDetails.customer_name}</td></tr>
              <tr><td class="label">போன்:</td><td>${loanDetails.phone_number}</td></tr>
              <tr><td class="label">முகவரி:</td><td>${loanDetails.address || '-'}</td></tr>
            </table>
          </div>
        </div>

        <strong>அடகு வைக்கப்பட்ட பொருட்களின் விவரம்:</strong>
        <table class="items">
          <thead>
            <tr>
              <th>விவரம்</th>
              <th>மொத்த எடை</th>
              <th>நிகர எடை</th>
              <th>தூய்மை</th>
              <th>மதிப்பு</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${loanDetails.description} <br><small>(${loanDetails.item_type})</small></td>
              <td>${loanDetails.gross_weight || loanDetails.weight || '-'} g</td>
              <td>${loanDetails.net_weight || '-'} g</td>
              <td>${loanDetails.purity || '-'}</td>
              <td>${formatMoney(loanDetails.appraised_value)}</td>
            </tr>
          </tbody>
        </table>

        <div class="terms">
          <strong>விதிமுறைகள்:</strong>
          <ol style="padding-left: 20px; margin: 5px 0;">
            <li>மேற்கண்ட அசல் தொகையை பெற்றுக்கொண்டேன்.</li>
            <li>இந்த பொருட்கள் எனக்கு சொந்தமானவை மற்றும் வில்லங்கம் இல்லாதவை.</li>
            <li>12 மாதங்களுக்கு மேல் வட்டி செலுத்தாத பட்சத்தில், அறிவிப்புக்கு பின் ஏலம் விடப்படும்.</li>
          </ol>
        </div>

        <div class="signatures">
          <div class="sig-box">வாடிக்கையாளர் கையப்பம்</div>
          <div class="sig-box">நிர்வாகத்திற்காக</div>
        </div>

        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  // --- UI: PREVIEW ---
  return (
    <div className="card shadow-sm">
      <div className="card-header bg-light d-flex justify-content-between align-items-center">
         <h5 className="mb-0 fw-bold"><i className="bi bi-receipt me-2"></i>Invoice Preview</h5>
         <div className="btn-group">
            <button className="btn btn-outline-primary" onClick={generateEnglishPDF}>
                <i className="bi bi-file-earmark-pdf me-2"></i>Download English PDF
            </button>
            <button className="btn btn-primary" onClick={generateTamilPrint}>
                <i className="bi bi-printer me-2"></i>Print Tamil
            </button>
         </div>
      </div>
      
      {/* Visual Preview (Simplified English HTML for User Confirmation) */}
      <div className="card-body bg-white p-5 border-bottom" style={{minHeight: '400px', opacity: 0.8, transform: 'scale(0.95)'}}>
         <div className="text-center mb-4">
            <h4 className="fw-bold text-uppercase">{settings.business_name}</h4>
            <p className="text-muted small mb-0">{settings.address}</p>
         </div>
         <div className="row g-4">
             <div className="col-6">
                <h6 className="fw-bold border-bottom pb-2">LOAN DETAILS</h6>
                <ul className="list-unstyled small">
                    <li className="mb-1"><strong>No:</strong> {loanDetails.book_loan_number}</li>
                    <li className="mb-1"><strong>Principal:</strong> {formatMoney(loanDetails.principal_amount)}</li>
                </ul>
             </div>
             <div className="col-6">
                <h6 className="fw-bold border-bottom pb-2">CUSTOMER</h6>
                <ul className="list-unstyled small">
                    <li className="mb-1"><strong>Name:</strong> {loanDetails.customer_name}</li>
                    <li className="mb-1"><strong>Phone:</strong> {loanDetails.phone_number}</li>
                </ul>
             </div>
         </div>
         <div className="alert alert-info mt-4 text-center small">
            <i className="bi bi-info-circle me-1"></i> 
            This is a preview. Use the buttons above to generate the final Print/PDF.
         </div>
      </div>
    </div>
  );
};