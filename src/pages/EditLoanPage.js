import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const EditLoanPage = () => {
  const API_URL = process.env.REACT_APP_API_URL;
  const { id } = useParams();
  const navigate = useNavigate();

  // --- Form State ---
  const [formData, setFormData] = useState({
    book_loan_number: '',
    interest_rate: '',
    pledge_date: '',
    due_date: '',
    item_type: 'gold',
    description: '',
    quality: '',
    gross_weight: '',
    net_weight: '',
    purity: '',
    appraised_value: ''
  });
  
  // --- Photo State ---
  const [photoSource, setPhotoSource] = useState('upload');
  const [itemPhoto, setItemPhoto] = useState(null); 
  const [photoPreview, setPhotoPreview] = useState(null); 
  const [removeItemImage, setRemoveItemImage] = useState(false); 
  
  // --- Transaction State ---
  const [transactions, setTransactions] = useState([]);
  const [newTx, setNewTx] = useState({ date: '', type: 'interest', amount: '' });
  const [addingTx, setAddingTx] = useState(false);

  // --- Camera State ---
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // --- Helpers ---
  const formatDateForInput = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toISOString().split('T')[0];
  };

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('data:') || url.startsWith('http')) return url;
    return `${API_URL}${url}`;
  };

  const formatCurrency = (amount) => `₹${parseFloat(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  // --- Effects ---
  useEffect(() => {
    const fetchLoan = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/loans/${id}`);
        const data = response.data.loanDetails;
        const txs = response.data.transactions || [];
        
        setFormData({
          book_loan_number: data.book_loan_number,
          interest_rate: data.interest_rate,
          pledge_date: formatDateForInput(data.pledge_date),
          due_date: formatDateForInput(data.due_date),
          item_type: data.item_type,
          description: data.description,
          quality: data.quality || '',
          gross_weight: data.gross_weight || data.weight || '',
          net_weight: data.net_weight || '',
          purity: data.purity || '',
          appraised_value: data.appraised_value || ''
        });

        if (data.item_image_data_url) {
            setPhotoPreview(getImageUrl(data.item_image_data_url));
        }

        setTransactions(txs);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching loan:", err);
        setError('Failed to load loan details.');
        setLoading(false);
      }
    };
    fetchLoan();
    
    return () => stopCameraStream();
  }, [id, API_URL]);

  // --- Form Handlers ---
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGrossWeightChange = (e) => {
      const gWeight = e.target.value;
      setFormData(prev => {
          if (prev.net_weight === '') {
              return { ...prev, gross_weight: gWeight, net_weight: gWeight };
          }
          return { ...prev, gross_weight: gWeight };
      });
  };

  // --- Transaction Handlers ---
  const handleAddTransaction = async () => {
      if(!newTx.date || !newTx.amount || parseFloat(newTx.amount) <= 0) return alert("Valid date and amount required");
      
      if(!window.confirm(`Add ${newTx.type.toUpperCase()} payment of ${newTx.amount} on ${newTx.date}?`)) return;

      setAddingTx(true);
      try {
          const token = localStorage.getItem('token');
          await axios.post(`${API_URL}/api/transactions`, {
              loan_id: id,
              amount_paid: newTx.amount,
              payment_type: newTx.type,
              custom_date: newTx.date // Sending the backdate
          }, { headers: { Authorization: `Bearer ${token}` } });
          
          alert("Transaction added.");
          
          // Refresh list
          const refresh = await axios.get(`${API_URL}/api/loans/${id}`);
          setTransactions(refresh.data.transactions);
          setNewTx({ date: '', type: 'interest', amount: '' });

      } catch (err) {
          alert(err.response?.data?.error || "Failed to add transaction");
      } finally {
          setAddingTx(false);
      }
  };

  const handleDeleteTransaction = async (txId) => {
      if(!window.confirm("Are you sure? This will remove the transaction record.")) return;
      // Note: Delete endpoint for transactions wasn't explicitly requested but logic would be similar
      // For now, we only implemented Add as per prompt. 
      alert("Delete functionality requires backend permission."); 
  };

  // --- Photo Handlers ---
  const stopCameraStream = () => {
    if (streamRef.current) { 
        streamRef.current.getTracks().forEach(track => track.stop()); 
        streamRef.current = null; 
    }
    setIsCameraOn(false);
    setShowCameraModal(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0]; 
    if (file) { 
        setItemPhoto(file); 
        setPhotoPreview(URL.createObjectURL(file)); 
        setRemoveItemImage(false);
        stopCameraStream(); 
    }
  };

  const startCamera = async () => {
    stopCameraStream(); 
    setItemPhoto(null); 
    setShowCameraModal(true);
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true }); 
        streamRef.current = stream;
        setTimeout(() => { 
            if (videoRef.current) { 
                videoRef.current.srcObject = stream; 
                videoRef.current.onloadedmetadata = () => setIsCameraOn(true); 
            } 
        }, 100);
    } catch (err) { 
        alert("Could not access camera."); 
        stopCameraStream(); 
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current && isCameraOn) {
        const video = videoRef.current; 
        const canvas = canvasRef.current; 
        canvas.width = video.videoWidth; 
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        canvas.toBlob(blob => { 
            if (blob) { 
                setItemPhoto(blob); 
                setPhotoPreview(canvas.toDataURL('image/jpeg')); 
                setRemoveItemImage(false);
                stopCameraStream(); 
            } 
        }, 'image/jpeg');
    }
  };

  const handleRemovePhoto = () => {
      setItemPhoto(null);
      setPhotoPreview(null);
      setRemoveItemImage(true);
      const fileInput = document.getElementById('itemPhotoInput'); 
      if (fileInput) fileInput.value = null;
  };

  // --- Submit Handler ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    const data = new FormData();
    Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
    });

    if (itemPhoto) {
        const fileName = itemPhoto instanceof File ? itemPhoto.name : 'capture.jpg';
        data.append('itemPhoto', itemPhoto, fileName);
    }

    data.append('removeItemImage', removeItemImage);

    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/api/loans/${id}`, data, {
          headers: { 
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${token}`
          }
      });
      alert('Loan updated successfully.');
      navigate(`/loans/${id}`);
    } catch (err) {
      console.error("Update Error:", err);
      alert(err.response?.data?.error || 'Failed to update loan.');
    } finally {
      setSaving(false);
    }
  };

  // --- Styles ---
  const modalOverlay = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1050 };
  const modalContent = { backgroundColor: 'white', padding: '20px', borderRadius: '8px', textAlign: 'center' };

  if (loading) return <div className="text-center mt-5"><div className="spinner-border text-primary"></div></div>;
  if (error) return <div className="alert alert-danger m-4">{error}</div>;

  return (
    <div className="container mt-4" style={{maxWidth: '800px'}}>
      <div className="card shadow-sm mb-5">
        <div className="card-header bg-warning text-dark">
          <h4 className="mb-0"><i className="bi bi-pencil-square me-2"></i>Edit Loan #{id}</h4>
        </div>
        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            
            {/* Section: Loan Terms */}
            <h6 className="text-muted text-uppercase fw-bold mb-3">Loan Terms</h6>
            <div className="row g-3 mb-4">
                <div className="col-md-6">
                    <label className="form-label fw-medium">Book Loan Number</label>
                    <input type="text" className="form-control" name="book_loan_number" value={formData.book_loan_number} onChange={handleChange} required />
                </div>
                <div className="col-md-6">
                    <label className="form-label fw-medium">Interest Rate (%)</label>
                    <input type="number" step="0.01" className="form-control" name="interest_rate" value={formData.interest_rate} onChange={handleChange} required />
                </div>
                <div className="col-md-6">
                    <label className="form-label fw-medium">Pledge Date</label>
                    <input type="date" className="form-control" name="pledge_date" value={formData.pledge_date} onChange={handleChange} required />
                </div>
                <div className="col-md-6">
                    <label className="form-label fw-medium">Due Date</label>
                    <input type="date" className="form-control" name="due_date" value={formData.due_date} onChange={handleChange} required />
                </div>
            </div>

            <hr className="text-muted"/>

            {/* Section: Item Details */}
            <h6 className="text-muted text-uppercase fw-bold mb-3">Item Details</h6>
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
                    <label className="form-label fw-medium">Description</label>
                    <input type="text" className="form-control" name="description" value={formData.description} onChange={handleChange} required />
                </div>
            </div>

            {/* Weights & Value */}
            <div className="row g-3 mb-4 p-3 bg-light rounded mx-0">
                 <div className="col-md-3">
                    <label className="form-label fw-medium">Gross Wt (g)</label>
                    <input type="number" step="0.001" className="form-control" name="gross_weight" value={formData.gross_weight} onChange={handleGrossWeightChange} />
                 </div>
                 <div className="col-md-3">
                    <label className="form-label fw-medium">Net Wt (g)</label>
                    <input type="number" step="0.001" className="form-control" name="net_weight" value={formData.net_weight} onChange={handleChange} />
                 </div>
                 <div className="col-md-3">
                    <label className="form-label fw-medium">Purity</label>
                    <input type="text" className="form-control" name="purity" value={formData.purity} onChange={handleChange} />
                 </div>
                 <div className="col-md-3">
                    <label className="form-label fw-medium">Appraised Value</label>
                    <input type="number" className="form-control" name="appraised_value" value={formData.appraised_value} onChange={handleChange} />
                 </div>
                 <div className="col-12">
                     <label className="form-label fw-medium">Quality / Remarks</label>
                     <input type="text" className="form-control" name="quality" value={formData.quality} onChange={handleChange} />
                 </div>
            </div>

            {/* Section: Photo Upload */}
            <h6 className="text-muted text-uppercase fw-bold mb-3">Item Photo</h6>
            <div className="mb-4">
                <div className="d-flex gap-3 mb-2">
                    <div className="form-check">
                        <input className="form-check-input" type="radio" name="photoSource" id="uploadRadio" checked={photoSource === 'upload'} onChange={() => setPhotoSource('upload')} />
                        <label className="form-check-label" htmlFor="uploadRadio">Upload File</label>
                    </div>
                    <div className="form-check">
                        <input className="form-check-input" type="radio" name="photoSource" id="captureRadio" checked={photoSource === 'capture'} onChange={() => { setPhotoSource('capture'); startCamera(); }} />
                        <label className="form-check-label" htmlFor="captureRadio">Use Camera</label>
                    </div>
                </div>

                {photoSource === 'upload' && ( 
                    <input type="file" id="itemPhotoInput" className="form-control" accept="image/*" onChange={handleFileChange} /> 
                )}

                {photoPreview ? (
                  <div className="mt-3 position-relative d-inline-block">
                    <img src={photoPreview} alt="Item" className="img-thumbnail" style={{ width: '150px', height: '150px', objectFit: 'cover' }} />
                    <button type="button" className="btn btn-danger btn-sm position-absolute top-0 end-0 m-1" onClick={handleRemovePhoto} title="Remove Photo">
                        <i className="bi bi-x-lg"></i>
                    </button>
                  </div>
                ) : (
                    <div className="mt-3 text-muted fst-italic small">No photo selected.</div>
                )}
            </div>

            <hr className="text-muted"/>

            <div className="d-flex justify-content-end gap-2">
              <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
              <button type="submit" className="btn btn-primary px-4" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* --- Section: Transaction History (Manual Log) --- */}
      <div className="card shadow-sm border-secondary-subtle">
          <div className="card-header bg-secondary text-white">
              <h5 className="mb-0 small fw-bold text-uppercase"><i className="bi bi-clock-history me-2"></i>Transaction History (Manual Log)</h5>
          </div>
          <div className="card-body p-4">
              <div className="alert alert-info small mb-3">
                  <i className="bi bi-info-circle me-2"></i>
                  Use this section to log <strong>past/missing payments</strong>. The system will automatically calculate how much covers interest vs principal based on the date selected.
              </div>

              {/* Add Transaction Form */}
              <div className="row g-2 align-items-end mb-4 border rounded p-3 bg-light mx-0">
                  <div className="col-md-4">
                      <label className="small text-muted fw-bold">Date</label>
                      <input type="date" className="form-control form-control-sm" value={newTx.date} onChange={e => setNewTx({...newTx, date: e.target.value})} />
                  </div>
                  <div className="col-md-3">
                      <label className="small text-muted fw-bold">Type</label>
                      <select className="form-select form-select-sm" value={newTx.type} onChange={e => setNewTx({...newTx, type: e.target.value})}>
                          <option value="interest">Interest</option>
                          <option value="principal">Principal</option>
                          <option value="settlement">Settlement</option>
                      </select>
                  </div>
                  <div className="col-md-3">
                      <label className="small text-muted fw-bold">Amount (₹)</label>
                      <input type="number" className="form-control form-control-sm" placeholder="0.00" value={newTx.amount} onChange={e => setNewTx({...newTx, amount: e.target.value})} />
                  </div>
                  <div className="col-md-2">
                      <button className="btn btn-success btn-sm w-100" onClick={handleAddTransaction} disabled={addingTx}>
                          {addingTx ? '...' : 'Add'}
                      </button>
                  </div>
              </div>

              {/* Transaction Table */}
              <div className="table-responsive">
                  <table className="table table-hover table-sm small align-middle">
                      <thead className="table-light">
                          <tr>
                              <th>Date</th>
                              <th>Type</th>
                              <th className="text-end">Amount</th>
                              <th className="text-end">User</th>
                          </tr>
                      </thead>
                      <tbody>
                          {transactions.length > 0 ? transactions.map(tx => (
                              <tr key={tx.id}>
                                  <td>{formatDateForInput(tx.payment_date)}</td>
                                  <td><span className="badge bg-light text-dark border">{tx.payment_type.toUpperCase()}</span></td>
                                  <td className="text-end fw-bold text-success">{formatCurrency(tx.amount_paid)}</td>
                                  <td className="text-end text-muted fst-italic">{tx.changed_by_username || 'sys'}</td>
                              </tr>
                          )) : (
                              <tr><td colSpan="4" className="text-center text-muted py-3">No transactions found.</td></tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
      </div>

      {/* Camera Modal */}
      {showCameraModal && (
          <div style={modalOverlay}>
            <div style={modalContent}>
              <h5 className="mb-3">Take Photo</h5>
              <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', maxWidth: '320px', borderRadius: '8px', border: '2px solid #ddd' }}></video>
              <div className="mt-3">
                <button type="button" className="btn btn-success me-2" onClick={capturePhoto} disabled={!isCameraOn}>
                    <i className="bi bi-camera-fill"></i> Capture
                </button>
                <button type="button" className="btn btn-secondary" onClick={stopCameraStream}>Cancel</button>
              </div>
              <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
            </div>
          </div>
      )}

    </div>
  );
};

export default EditLoanPage;