// src/components/NoticeModal.js
import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

const NoticeModal = ({ show, onClose, loan }) => {
  const [noticeData, setNoticeData] = useState({
    customer_name: '',
    address: '',
    notice_date: '',
    book_loan_number: '',
    pledge_date: '',
    due_date: '',
    principal_amount: ''
  });

  const [settings, setSettings] = useState({
    business_name: 'SRI KUBERA BANKERS',
    address: '123 Main Bazaar, Salem, Tamil Nadu',
    phone_number: '9876543210',
    logo_url: null
  });

  // --- FETCH SETTINGS (Branch Aware) ---
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        
        // 1. Get Global Settings
        const settingsRes = await axios.get(`${API_URL}/api/settings`, { headers });
        let finalSettings = settingsRes.data;

        // 2. Check if loan has branch and fetch override
        if (loan && loan.branch_id) {
            try {
                const branchRes = await axios.get(`${API_URL}/api/branches/${loan.branch_id}`, { headers });
                finalSettings = {
                    ...finalSettings,
                    address: branchRes.data.address || finalSettings.address,
                    phone_number: branchRes.data.phone_number || finalSettings.phone_number
                };
            } catch (bErr) {
                console.warn("Using global settings");
            }
        }

        setSettings({
            business_name: finalSettings.business_name || 'SRI KUBERA BANKERS',
            address: finalSettings.address || '',
            phone_number: finalSettings.phone_number || '',
            logo_url: finalSettings.logo_url || null
        });

      } catch (err) {
        console.error("Error fetching settings for notice:", err);
      }
    };

    if (show) fetchConfig(); 
  }, [show, loan]);

  // --- SYNC LOAN DATA ---
  useEffect(() => {
    if (loan) {
      setNoticeData({
        customer_name: loan.customer_name || '',
        address: loan.address || '',
        notice_date: new Date().toLocaleDateString('en-GB'),
        book_loan_number: loan.book_loan_number || '',
        pledge_date: loan.pledge_date ? new Date(loan.pledge_date).toLocaleDateString('en-GB') : '',
        due_date: loan.due_date ? new Date(loan.due_date).toLocaleDateString('en-GB') : '',
        principal_amount: loan.principal_amount ? parseFloat(loan.principal_amount).toFixed(2) : ''
      });
    }
  }, [loan]);

  // --- PDF GENERATION (Use 'settings' state which now has correct branch address) ---
  const generateEnglishPDF = () => {
    const doc = new jsPDF();
    const data = noticeData;

    if (settings.logo_url) {
        try {
            doc.addImage(settings.logo_url, 'PNG', 15, 10, 25, 25); 
        } catch (e) { console.warn("Logo error", e); }
    }

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(settings.business_name.toUpperCase(), 105, 20, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const contactText = `${settings.address} | Phone: ${settings.phone_number}`;
    doc.text(contactText, 105, 26, { align: "center" });
    
    doc.setLineWidth(0.5);
    doc.line(10, 38, 200, 38);

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("FINAL NOTICE / AUCTION WARNING", 105, 50, { align: "center" });

    // (Rest of the PDF generation logic remains the same, using 'settings' variable)
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Date: ${data.notice_date}`, 190, 60, { align: "right" });

    doc.text("To,", 15, 70);
    doc.setFont("helvetica", "bold");
    doc.text(data.customer_name, 15, 76);
    doc.setFont("helvetica", "normal");

    const addressLines = doc.splitTextToSize(data.address || "(Address Not Provided)", 80);
    doc.text(addressLines, 15, 82);

    const subjectY = 82 + (addressLines.length * 5) + 10;
    doc.setFont("helvetica", "bold");
    doc.text(`Sub: Non-payment of Loan #${data.book_loan_number} - Pledge Auction Notice`, 15, subjectY);

    doc.setFont("helvetica", "normal");
    const startY = subjectY + 10;

    doc.text("Dear Sir/Madam,", 15, startY);
    doc.text(`Ref Loan No: ${data.book_loan_number}`, 15, startY + 10);
    doc.text(`Pledged Date: ${data.pledge_date}`, 70, startY + 10);
    doc.text(`Principal Amount: Rs. ${data.principal_amount}`, 15, startY + 16);

    const para1 = `This is to inform you that the above-mentioned loan is overdue. Despite multiple reminders, the interest and principal amount remain unpaid. The loan was due on ${data.due_date}.`;
    const para2 = `You are hereby requested to settle the total outstanding dues including interest within 7 days from the receipt of this notice.`;
    const para3 = `Failing which, we will be constrained to auction the pledged ornaments/articles to recover our dues without further notice.`;
    const para4 = `Please treat this as urgent.`;

    let currentY = startY + 26;
    [para1, para2, para3].forEach(para => {
        const split = doc.splitTextToSize(para, 180);
        doc.text(split, 15, currentY);
        currentY += (split.length * 5) + 5;
    });
    doc.text(para4, 15, currentY + 5);

    doc.text(`For ${settings.business_name}`, 150, currentY + 35, { align: "center" });
    doc.text("(Manager)", 150, currentY + 50, { align: "center" });

    doc.save(`Notice_English_${data.book_loan_number}.pdf`);
  };

  // --- TAMIL PRINT GENERATOR ---
  const generateTamilPrint = () => {
    const data = noticeData;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return alert("Please allow popups.");

    const logoImgTag = settings.logo_url 
      ? `<img src="${settings.logo_url}" style="height: 80px; width: auto; display: block; margin: 0 auto 10px;" />` 
      : '';

    const htmlContent = `
      <html>
      <head>
        <title>Notice - ${data.book_loan_number}</title>
        <style>
          body { font-family: 'Arial Unicode MS', 'Latha', 'Vijaya', sans-serif; padding: 40px; }
          .header-container { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 20px; }
          .title { text-align: center; font-weight: bold; font-size: 20px; text-decoration: underline; margin-top: 20px; }
          /* ... styles ... */
          .footer { margin-top: 60px; text-align: right; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header-container">
          ${logoImgTag}
          <h1 style="margin: 0; font-size: 24px;">${settings.business_name}</h1>
          <p style="margin: 5px 0;">${settings.address}</p>
          <p style="margin: 0;">போன்: ${settings.phone_number}</p>
        </div>

        <div class="title">இறுதி அறிவிப்பு / ஏல எச்சரிக்கை</div>
        
        <div style="text-align: right; margin-top: 20px;">தேதி: ${data.notice_date}</div>

        <div style="margin-top: 20px; line-height: 1.5;">
          <strong>பெறுநர்,</strong><br>
          ${data.customer_name},<br>
          ${data.address ? data.address.replace(/\n/g, '<br>') : '(முகவரி இல்லை)'}
        </div>

        <div style="margin-top: 20px; font-weight: bold;">
          பொருள்: கடன் எண் ${data.book_loan_number} - நிலுவை தொகை மற்றும் ஏல அறிவிப்பு குறித்து.
        </div>

        <div style="margin-top: 20px; line-height: 1.6; text-align: justify;">
          <p>அன்புடையீர்,</p>
          <div style="margin: 20px 0; font-weight: bold;">
            கடன் எண்: ${data.book_loan_number} &nbsp;&nbsp;|&nbsp;&nbsp; 
            கடன் தேதி: ${data.pledge_date} &nbsp;&nbsp;|&nbsp;&nbsp; 
            அசல் தொகை: ₹${data.principal_amount}
          </div>
          <p>தங்கள் பெற்ற மேற்கண்ட அடகு கடன் தவணை காலம் முடிந்துவிட்டது...</p>
          </div>

        <div class="footer">
          <p>இங்ஙனம்,</p>
          <p>${settings.business_name}</p>
          <br><br>
          (மேலாளர்)
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  if (!show) return null;

  return (
    <div style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
        backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050, display: 'flex', 
        justifyContent: 'center', alignItems: 'center'
    }}>
      <div className="bg-white rounded shadow-lg" style={{width: '600px', maxHeight: '90vh', overflowY: 'auto'}}>
        <div className="modal-header p-3 border-bottom d-flex justify-content-between align-items-center bg-light">
            <h5 className="m-0 fw-bold"><i className="bi bi-file-earmark-text me-2"></i>Prepare Legal Notice</h5>
            <button className="btn-close" onClick={onClose}></button>
        </div>
        <div className="modal-body p-4">
            {/* UI remains same */}
            <div className="row g-3 mb-3">
               <div className="col-md-6">
                  <label className="form-label small fw-bold text-muted">Notice Date</label>
                  <input type="text" className="form-control" value={noticeData.notice_date} onChange={(e) => setNoticeData({...noticeData, notice_date: e.target.value})} />
               </div>
               <div className="col-md-6">
                  <label className="form-label small fw-bold text-muted">Customer Name</label>
                  <input type="text" className="form-control" value={noticeData.customer_name} onChange={(e) => setNoticeData({...noticeData, customer_name: e.target.value})} />
               </div>
            </div>
            <div className="mb-3">
                <label className="form-label small fw-bold text-muted">Address</label>
                <textarea className="form-control" rows="3" value={noticeData.address} onChange={(e) => setNoticeData({...noticeData, address: e.target.value})}></textarea>
            </div>
            {/* ... */}
        </div>
        <div className="modal-footer p-3 border-top bg-light">
            <button className="btn btn-secondary me-auto" onClick={onClose}>Cancel</button>
            <div className="d-flex gap-2">
                <button className="btn btn-outline-primary" onClick={generateEnglishPDF}><i className="bi bi-printer me-2"></i>English (PDF)</button>
                <button className="btn btn-primary" onClick={generateTamilPrint}><i className="bi bi-translate me-2"></i>Tamil (Print)</button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default NoticeModal;