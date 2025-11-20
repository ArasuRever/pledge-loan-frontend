// src/components/LoanForm.js
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const LoanForm = ({ customerId, onLoanAdded, onCancel }) => {
  const API_URL = process.env.REACT_APP_API_URL;

  // --- Form State ---
  const [formData, setFormData] = useState({
    book_loan_number: '',
    principal_amount: '',
    interest_rate: '2.5', // <--- ENSURE THIS IS '2.5'
    item_type: 'gold',
    description: '',
    quality: '',
    gross_weight: '',
    net_weight: '',
    purity: '',
    appraised_value: '',
    deductFirstMonthInterest: false
  });

  // --- Photo State ---
  const [photoSource, setPhotoSource] = useState('upload');
  const [itemPhoto, setItemPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => { return () => stopCameraStream(); }, []);

  // --- Handlers ---
  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleGrossWeightChange = (e) => {
     const gWeight = e.target.value;
     if (formData.net_weight === '') {
        setFormData(prev => ({ ...prev, gross_weight: gWeight, net_weight: gWeight }));
     } else {
        setFormData(prev => ({ ...prev, gross_weight: gWeight }));
     }
  };

  const stopCameraStream = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(track => track.stop()); streamRef.current = null; }
    setIsCameraOn(false); setShowCameraModal(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0]; 
    if (file) { setItemPhoto(file); setPhotoPreview(URL.createObjectURL(file)); stopCameraStream(); }
  };

  const startCamera = async () => {
    stopCameraStream(); setItemPhoto(null); setPhotoPreview(null); setShowCameraModal(true);
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true }); 
        streamRef.current = stream;
        setTimeout(() => { if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.onloadedmetadata = () => setIsCameraOn(true); } }, 100);
    } catch (err) { alert("Could not access camera."); stopCameraStream(); }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current && isCameraOn) {
        const video = videoRef.current; const canvas = canvasRef.current; 
        canvas.width = video.videoWidth; canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        canvas.toBlob(blob => { if (blob) { setItemPhoto(blob); setPhotoPreview(canvas.toDataURL('image/jpeg')); stopCameraStream(); } }, 'image/jpeg');
    }
  };

  const clearPhoto = () => {
    setItemPhoto(null); setPhotoPreview(null); stopCameraStream();
    const fileInput = document.getElementById('itemPhotoInput'); if (fileInput) fileInput.value = null;
  };

  const handleSubmit = async (e) => {
      e.preventDefault();
      console.log("Submitting Loan Data:", formData); // <--- DEBUG LOG

      const data = new FormData();
      data.append('customer_id', customerId);
      Object.keys(formData).forEach(key => {
          data.append(key, formData[key]);
      });
      
      if (itemPhoto) { 
          const fileName = itemPhoto instanceof File ? itemPhoto.name : 'capture.jpg'; 
          data.append('itemPhoto', itemPhoto, fileName); 
      }

      try {
        await axios.post(`${API_URL}/api/loans`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
        alert('New loan added!');
        // Reset
        setFormData({
            book_loan_number: '', principal_amount: '', 
            interest_rate: '2.5', // <--- RESET TO 2.5 explicitly
            item_type: 'gold', description: '', quality: '',
            gross_weight: '', net_weight: '', purity: '', appraised_value: '',
            deductFirstMonthInterest: false
        });
        clearPhoto();
        onLoanAdded();
      } catch (error) {
        const msg = error.response?.data?.error || error.response?.data || 'Failed to add loan.';
        alert(msg);
      }
  };

  // --- Styles for Modal ---
  const modalOverlay = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1050 };
  const modalContent = { backgroundColor: 'white', padding: '20px', borderRadius: '8px', textAlign: 'center' };

  return (
    <div className="card shadow-sm border-0 my-4">
      <div className="card-header bg-white py-3">
        <h5 className="mb-0 text-primary fw-bold"><i className="bi bi-plus-circle me-2"></i>Create New Pledge</h5>
      </div>
      <div className="card-body p-4">
        <form onSubmit={handleSubmit}>
          {/* ROW 1: Basic Loan Info */}
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label fw-medium">Book Loan Number <span className="text-danger">*</span></label>
              <input type="text" className="form-control" name="book_loan_number" value={formData.book_loan_number} onChange={handleChange} required />
            </div>
            <div className="col-md-6">
               <label className="form-label fw-medium">Principal Amount (₹) <span className="text-danger">*</span></label>
               <input type="number" className="form-control" name="principal_amount" value={formData.principal_amount} onChange={handleChange} required />
            </div>
          </div>

          {/* ROW 2: Interest & Deduction */}
          <div className="row g-3 mb-3">
            <div className="col-md-6">
               <label className="form-label fw-medium">Monthly Interest Rate (%)</label>
               {/* UPDATED: Explicit options to prevent mapping errors */}
               <select className="form-select" name="interest_rate" value={formData.interest_rate} onChange={handleChange}>
                  <option value="1.0">1.0%</option>
                  <option value="1.5">1.5%</option>
                  <option value="2.0">2.0%</option>
                  <option value="2.25">2.25%</option>
                  <option value="2.5">2.5%</option>
                  <option value="3.0">3.0%</option>
                  <option value="3.5">3.5%</option>
               </select>
             </div>
             <div className="col-md-6 d-flex align-items-end">
                <div className="form-check mb-2">
                  <input className="form-check-input" type="checkbox" id="deductInterest" name="deductFirstMonthInterest" checked={formData.deductFirstMonthInterest} onChange={handleChange} />
                  <label className="form-check-label" htmlFor="deductInterest">Deduct 1st Month Interest Now</label>
                </div>
             </div>
          </div>

          <hr className="text-muted" />
          <h6 className="text-muted mb-3 text-uppercase small fw-bold">Item Details</h6>

          {/* ROW 3: Item Type & Description */}
          <div className="row g-3 mb-3">
             <div className="col-md-4">
                <label className="form-label fw-medium">Item Type</label>
                <select className="form-select" name="item_type" value={formData.item_type} onChange={handleChange}>
                    <option value="gold">Gold</option>
                    <option value="silver">Silver</option>
                    <option value="brass">Brass</option>
                    <option value="electronic">Electronic</option>
                    <option value="vehicle">Vehicle</option>
                    <option value="other">Other</option>
                </select>
             </div>
             <div className="col-md-8">
                <label className="form-label fw-medium">Description <span className="text-danger">*</span></label>
                <input type="text" className="form-control" name="description" placeholder="e.g. Gold Chain with Ruby stone" value={formData.description} onChange={handleChange} required />
             </div>
          </div>

          {/* ROW 4: Detailed Weights & Purity */}
          <div className="row g-3 mb-3 p-3 bg-light rounded mx-1">
             <div className="col-md-3">
                <label className="form-label fw-medium">Gross Wt (g)</label>
                <input type="number" step="0.001" className="form-control" name="gross_weight" value={formData.gross_weight} onChange={handleGrossWeightChange} placeholder="0.000" />
             </div>
             <div className="col-md-3">
                <label className="form-label fw-medium">Net Wt (g)</label>
                <input type="number" step="0.001" className="form-control" name="net_weight" value={formData.net_weight} onChange={handleChange} placeholder="0.000" />
             </div>
             <div className="col-md-3">
                <label className="form-label fw-medium">Purity / Quality</label>
                <input type="text" className="form-control" name="purity" value={formData.purity} onChange={handleChange} placeholder="e.g. 916 KDM" />
             </div>
             <div className="col-md-3">
                <label className="form-label fw-medium">Appraised Val (₹)</label>
                <input type="number" className="form-control" name="appraised_value" value={formData.appraised_value} onChange={handleChange} placeholder="Market Value" />
             </div>
          </div>

          {/* Photo Section */}
          <div className="mb-4">
            <label className="form-label d-block fw-medium">Item Photo</label>
            <div className="d-flex gap-3 mb-2">
                <div className="form-check">
                    <input className="form-check-input" type="radio" name="photoSource" id="uploadRadio" checked={photoSource === 'upload'} onChange={() => setPhotoSource('upload')} />
                    <label className="form-check-label" htmlFor="uploadRadio">Upload</label>
                </div>
                <div className="form-check">
                    <input className="form-check-input" type="radio" name="photoSource" id="captureRadio" checked={photoSource === 'capture'} onChange={() => { setPhotoSource('capture'); startCamera(); }} />
                    <label className="form-check-label" htmlFor="captureRadio">Camera</label>
                </div>
            </div>

            {photoSource === 'upload' && ( <input type="file" id="itemPhotoInput" className="form-control" accept="image/*" onChange={handleFileChange} /> )}
            
            {photoPreview && (
              <div className="mt-3 position-relative d-inline-block">
                <img src={photoPreview} alt="Preview" className="img-thumbnail" style={{ width: '120px', height: '120px', objectFit: 'cover' }} />
                <button type="button" className="btn-close position-absolute top-0 end-0 bg-white" onClick={clearPhoto}></button>
              </div>
            )}
          </div>

          {/* Action Buttons with Cancel */}
          <div className="d-flex justify-content-end gap-2">
             {onCancel && (
               <button type="button" className="btn btn-secondary btn-lg" onClick={onCancel}>
                 Cancel
               </button>
             )}
             <button type="submit" className="btn btn-primary btn-lg flex-grow-1 flex-md-grow-0">
               Create Loan Record
             </button>
          </div>
        </form>

        {/* Camera Modal */}
        {showCameraModal && (
          <div style={modalOverlay}>
            <div style={modalContent}>
              <h5 className="mb-3">Take Photo</h5>
              <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', maxWidth: '320px', borderRadius: '8px', border: '2px solid #ddd' }}></video>
              <div className="mt-3">
                <button type="button" className="btn btn-success me-2" onClick={capturePhoto} disabled={!isCameraOn}><i className="bi bi-camera-fill"></i> Capture</button>
                <button type="button" className="btn btn-secondary" onClick={stopCameraStream}>Cancel</button>
              </div>
              <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoanForm;