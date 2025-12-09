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
  
  // --- Photo & UI State ---
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
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    if (dateString.length === 10 && !dateString.includes('T')) return dateString;
    const d = new Date(dateString);
    return d.toLocaleDateString('en-CA'); 
  };

  const formatDisplayDate = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatCurrency = (amount) => `₹${Math.round(parseFloat(amount || 0)).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const stopCameraStream = () => {
    if (streamRef.current) { 
        streamRef.current.getTracks().forEach(track => track.stop()); 
        streamRef.current = null; 
    }
    setIsCameraOn(false);
    setShowCameraModal(false);
  };

  // --- Effects ---
  useEffect(() => {
    const getImageUrl = (url) => {
      if (!url) return null;
      if (url.startsWith('data:') || url.startsWith('http')) return url;
      return `${API_URL}${url}`;
    };

    const fetchLoan = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/api/loans/${id}`, { headers: { Authorization: `Bearer ${token}` } });
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
    
    return () => {
      if (streamRef.current) { 
        streamRef.current.getTracks().forEach(track => track.stop()); 
      }
    };
  }, [id, API_URL]);

  // --- Handlers ---
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleGrossWeightChange = (e) => {
      const gWeight = e.target.value;
      setFormData(prev => {
          if (prev.net_weight === '') {
              return { ...prev, gross_weight: gWeight, net_weight: gWeight };
          }
          return { ...prev, gross_weight: gWeight };
      });
  };

  const handleAddTransaction = async () => {
      if(!newTx.date || !newTx.amount || parseFloat(newTx.amount) <= 0) return alert("Valid date and amount required");
      if(!window.confirm(`Add ${newTx.type.toUpperCase()} of ${newTx.amount} on ${newTx.date}?`)) return;

      setAddingTx(true);
      try {
          const token = localStorage.getItem('token');
          await axios.post(`${API_URL}/api/transactions`, {
              loan_id: id,
              amount_paid: newTx.amount,
              payment_type: newTx.type,
              custom_date: newTx.date
          }, { headers: { Authorization: `Bearer ${token}` } });
          
          alert("Transaction added.");
          const refresh = await axios.get(`${API_URL}/api/loans/${id}`, { headers: { Authorization: `Bearer ${token}` } });
          setTransactions(refresh.data.transactions);
          setNewTx({ date: '', type: 'interest', amount: '' });
      } catch (err) {
          alert(err.response?.data?.error || "Failed to add transaction");
      } finally {
          setAddingTx(false);
      }
  };

  const handleDeleteTransaction = async (txId) => {
      if(!window.confirm("Undo this transaction? It will be removed permanently.")) return;
      try {
          const token = localStorage.getItem('token');
          await axios.delete(`${API_URL}/api/transactions/${txId}`, { headers: { Authorization: `Bearer ${token}` } });
          alert("Transaction undone.");
          
          const refresh = await axios.get(`${API_URL}/api/loans/${id}`, { headers: { Authorization: `Bearer ${token}` } });
          setTransactions(refresh.data.transactions);
      } catch (err) {
          alert(err.response?.data?.error || "Failed to delete transaction.");
      }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    if (itemPhoto) {
        const fileName = itemPhoto instanceof File ? itemPhoto.name : 'capture.jpg';
        data.append('itemPhoto', itemPhoto, fileName);
    }
    data.append('removeItemImage', removeItemImage);

    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/api/loans/${id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
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
  const modalOverlay = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1050, backdropFilter: 'blur(5px)' };
  const modalContent = { backgroundColor: 'white', padding: '20px', borderRadius: '16px', textAlign: 'center', width: '90%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' };

  if (loading) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary" style={{width: '3rem', height: '3rem'}}></div></div>;
  if (error) return <div className="alert alert-danger m-5 shadow-sm border-0">{error}</div>;

  return (
    <div className="container-fluid bg-light min-vh-100 py-5">
      <div className="container" style={{maxWidth: '1100px'}}>
        
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h2 className="fw-bold mb-1 text-dark">Edit Loan</h2>
                <p className="text-muted mb-0">Update details for Loan #{id}</p>
            </div>
            <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
                <i className="bi bi-arrow-left me-2"></i>Back
            </button>
        </div>

        <form onSubmit={handleSubmit}>
            <div className="row g-4 mb-4">
                
                {/* Left Column: Loan Data */}
                <div className="col-lg-8">
                    {/* 1. Loan Terms Card */}
                    <div className="card shadow-sm border-0 rounded-4 mb-4">
                        <div className="card-header bg-white border-bottom-0 pt-4 px-4 pb-0">
                            <h5 className="fw-bold text-primary"><i className="bi bi-file-earmark-text me-2"></i>Loan Terms</h5>
                        </div>
                        <div className="card-body p-4">
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <div className="form-floating">
                                        <input type="text" className="form-control" id="bookLoanNo" name="book_loan_number" value={formData.book_loan_number} onChange={handleChange} required />
                                        <label htmlFor="bookLoanNo">Book Loan Number</label>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="form-floating">
                                        <input type="number" step="0.01" className="form-control" id="intRate" name="interest_rate" value={formData.interest_rate} onChange={handleChange} required />
                                        <label htmlFor="intRate">Interest Rate (%)</label>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="form-floating">
                                        <input type="date" className="form-control" id="pledgeDate" name="pledge_date" value={formData.pledge_date} onChange={handleChange} required />
                                        <label htmlFor="pledgeDate">Pledge Date</label>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="form-floating">
                                        <input type="date" className="form-control" id="dueDate" name="due_date" value={formData.due_date} onChange={handleChange} required />
                                        <label htmlFor="dueDate">Due Date</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Manual Transaction Log (MOVED HERE) */}
                    <div className="card shadow-sm border-0 rounded-4 mb-4">
                        <div className="card-header bg-secondary bg-opacity-10 border-bottom-0 pt-3 px-3 d-flex justify-content-between align-items-center">
                            <h6 className="fw-bold mb-0 small text-uppercase text-secondary"><i className="bi bi-clock-history me-2"></i>Manual Transaction Log</h6>
                            <span className="badge bg-white text-dark border">Backdating Enabled</span>
                        </div>
                        <div className="card-body p-4">
                            {/* Manual Entry Form */}
                            <div className="bg-light p-3 rounded-3 border mb-4">
                                <label className="small fw-bold text-muted mb-2 d-block">Log Past/Missing Payment</label>
                                <div className="row g-2 align-items-end">
                                    <div className="col-md-3">
                                        <label className="small text-muted" style={{fontSize: '0.75rem'}}>Date</label>
                                        <input type="date" className="form-control form-control-sm" value={newTx.date} onChange={e => setNewTx({...newTx, date: e.target.value})} />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="small text-muted" style={{fontSize: '0.75rem'}}>Type</label>
                                        <select className="form-select form-select-sm" value={newTx.type} onChange={e => setNewTx({...newTx, type: e.target.value})}>
                                            <option value="interest">Interest Payment</option>
                                            <option value="principal">Principal Repayment</option>
                                            <option value="disbursement">Disbursement (Top-up)</option>
                                            <option value="settlement">Settlement</option>
                                        </select>
                                    </div>
                                    <div className="col-md-4">
                                        <label className="small text-muted" style={{fontSize: '0.75rem'}}>Amount</label>
                                        <input type="number" className="form-control form-control-sm" placeholder="₹ Amount" value={newTx.amount} onChange={e => setNewTx({...newTx, amount: e.target.value})} />
                                    </div>
                                    <div className="col-md-2">
                                        <button type="button" className="btn btn-success btn-sm w-100 fw-bold" onClick={handleAddTransaction} disabled={addingTx}>
                                            {addingTx ? '...' : 'ADD'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* List */}
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th scope="col" className="small text-muted">Date</th>
                                            <th scope="col" className="small text-muted">Type</th>
                                            <th scope="col" className="small text-muted text-end">Amount</th>
                                            <th scope="col" className="small text-muted text-end">User</th>
                                            <th scope="col" className="small text-muted text-center" style={{width:'80px'}}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactions.length > 0 ? (
                                            transactions.map((tx) => {
                                                let badgeClass = "badge bg-light text-secondary border fw-normal";
                                                let amtClass = "fw-bold text-success";
                                                
                                                if (tx.payment_type === 'disbursement') {
                                                     badgeClass = "badge bg-primary bg-opacity-10 text-primary border border-primary-subtle fw-normal";
                                                     amtClass = "fw-bold text-primary";
                                                } else if (tx.payment_type === 'discount') {
                                                     badgeClass = "badge bg-warning bg-opacity-10 text-warning-emphasis border border-warning-subtle fw-normal";
                                                     amtClass = "fw-bold text-danger";
                                                }

                                                return (
                                                    <tr key={tx.id}>
                                                        <td className="fw-medium">{formatDisplayDate(tx.payment_date)}</td>
                                                        <td><span className={badgeClass} style={{fontSize: '0.7rem'}}>{tx.payment_type.toUpperCase()}</span></td>
                                                        <td className={`text-end ${amtClass}`}>{formatCurrency(tx.amount_paid)}</td>
                                                        <td className="text-end text-muted small fst-italic">{tx.changed_by_username || 'sys'}</td>
                                                        <td className="text-center">
                                                            <button 
                                                                className="btn btn-sm text-danger fw-bold" 
                                                                style={{fontSize: '0.75rem'}}
                                                                onClick={() => handleDeleteTransaction(tx.id)}
                                                            >
                                                                Undo
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr><td colSpan="5" className="text-center text-muted py-4 small">No transactions found.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* 3. Item Details Card */}
                    <div className="card shadow-sm border-0 rounded-4">
                        <div className="card-header bg-white border-bottom-0 pt-4 px-4 pb-0">
                            <h5 className="fw-bold text-success"><i className="bi bi-box-seam me-2"></i>Item Details</h5>
                        </div>
                        <div className="card-body p-4">
                            <div className="row g-3">
                                <div className="col-md-4">
                                    <div className="form-floating">
                                        <select className="form-select" id="itemType" name="item_type" value={formData.item_type} onChange={handleChange}>
                                            <option value="gold">Gold</option>
                                            <option value="silver">Silver</option>
                                            <option value="brass">Brass</option>
                                            <option value="electronic">Electronic</option>
                                            <option value="vehicle">Vehicle</option>
                                            <option value="other">Other</option>
                                        </select>
                                        <label htmlFor="itemType">Item Type</label>
                                    </div>
                                </div>
                                <div className="col-md-8">
                                    <div className="form-floating">
                                        <input type="text" className="form-control" id="desc" name="description" value={formData.description} onChange={handleChange} required />
                                        <label htmlFor="desc">Description</label>
                                    </div>
                                </div>
                                <div className="col-12">
                                    <div className="p-3 bg-light rounded-3 border">
                                        <div className="row g-2">
                                            <div className="col-md-4">
                                                <label className="small text-muted fw-bold mb-1">Gross Weight (g)</label>
                                                <input type="number" step="0.001" className="form-control" name="gross_weight" value={formData.gross_weight} onChange={handleGrossWeightChange} />
                                            </div>
                                            <div className="col-md-4">
                                                <label className="small text-muted fw-bold mb-1">Net Weight (g)</label>
                                                <input type="number" step="0.001" className="form-control" name="net_weight" value={formData.net_weight} onChange={handleChange} />
                                            </div>
                                            <div className="col-md-4">
                                                <label className="small text-muted fw-bold mb-1">Purity</label>
                                                <input type="text" className="form-control" name="purity" value={formData.purity} onChange={handleChange} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="form-floating">
                                        <input type="number" className="form-control" id="appValue" name="appraised_value" value={formData.appraised_value} onChange={handleChange} />
                                        <label htmlFor="appValue">Appraised Value (₹)</label>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="form-floating">
                                        <input type="text" className="form-control" id="quality" name="quality" value={formData.quality} onChange={handleChange} />
                                        <label htmlFor="quality">Quality / Remarks</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Visuals & Actions */}
                <div className="col-lg-4">
                    
                    {/* Photo Card */}
                    <div className="card shadow-sm border-0 rounded-4 mb-4">
                        <div className="card-header bg-white border-bottom-0 pt-4 px-4 pb-0">
                            <h6 className="fw-bold text-dark mb-0">Item Photo</h6>
                        </div>
                        <div className="card-body p-4 text-center">
                            <div className="mb-3">
                                {photoPreview ? (
                                    <div className="position-relative d-inline-block">
                                        <img src={photoPreview} alt="Preview" className="img-fluid rounded-3 border shadow-sm" style={{ maxHeight: '200px', objectFit: 'cover' }} />
                                        <button type="button" className="btn btn-danger btn-sm position-absolute top-0 end-0 m-2 rounded-circle shadow" onClick={handleRemovePhoto} style={{width:'32px', height:'32px', padding:0}}>
                                            <i className="bi bi-x-lg"></i>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="bg-light rounded-3 d-flex flex-column align-items-center justify-content-center border border-dashed" style={{ height: '180px' }}>
                                        <i className="bi bi-image text-muted fs-1 mb-2"></i>
                                        <span className="text-muted small">No photo uploaded</span>
                                    </div>
                                )}
                            </div>

                            <div className="btn-group w-100" role="group">
                                <input type="radio" className="btn-check" name="photoSource" id="uploadRadio" autoComplete="off" checked={photoSource === 'upload'} onChange={() => setPhotoSource('upload')} />
                                <label className="btn btn-outline-secondary" htmlFor="uploadRadio"><i className="bi bi-upload me-1"></i> Upload</label>

                                <input type="radio" className="btn-check" name="photoSource" id="captureRadio" autoComplete="off" checked={photoSource === 'capture'} onChange={() => { setPhotoSource('capture'); startCamera(); }} />
                                <label className="btn btn-outline-secondary" htmlFor="captureRadio"><i className="bi bi-camera me-1"></i> Camera</label>
                            </div>

                            {photoSource === 'upload' && (
                                <div className="mt-3">
                                    <input type="file" id="itemPhotoInput" className="form-control form-control-sm" accept="image/*" onChange={handleFileChange} />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Save Button Card */}
                    <div className="card shadow-sm border-0 rounded-4">
                        <div className="card-body p-4">
                            <button type="submit" className="btn btn-primary w-100 py-3 fw-bold rounded-pill shadow-sm" disabled={saving}>
                                {saving ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</> : <><i className="bi bi-save me-2"></i>SAVE CHANGES</>}
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </form>
      </div>

      {/* Camera Modal */}
      {showCameraModal && (
          <div style={modalOverlay}>
            <div style={modalContent}>
              <h5 className="mb-3 fw-bold">Take Photo</h5>
              <div className="position-relative overflow-hidden bg-black rounded-3 mb-3" style={{aspectRatio: '4/3'}}>
                  <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }}></video>
              </div>
              <div className="d-flex justify-content-center gap-2">
                <button type="button" className="btn btn-light border" onClick={stopCameraStream}>Cancel</button>
                <button type="button" className="btn btn-success px-4" onClick={capturePhoto} disabled={!isCameraOn}>
                    <i className="bi bi-camera-fill me-2"></i>Capture
                </button>
              </div>
              <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
            </div>
          </div>
      )}
    </div>
  );
};

export default EditLoanPage;