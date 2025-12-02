// src/pages/CustomerPage.js
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import EditCustomerForm from '../components/EditCustomerForm';
import LoanForm from '../components/LoanForm'; 

// --- Modal Styles ---
const modalOverlayStyle = {
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex',
    justifyContent: 'center', alignItems: 'center', zIndex: 1050,
    backdropFilter: 'blur(5px)'
};
const modalContentStyle = {
    backgroundColor: 'white', borderRadius: '16px', 
    width: '100%', maxWidth: '900px',
    maxHeight: '90vh', overflowY: 'auto',
    position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
};

const CustomerPage = ({ userRole }) => {
  const API_URL = process.env.REACT_APP_API_URL;
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Data State
  const [customer, setCustomer] = useState(null);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // UI State
  const [isEditing, setIsEditing] = useState(false);
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [hoverProfile, setHoverProfile] = useState(false);

  // Photo Capture State
  const [photoSource, setPhotoSource] = useState('upload');
  const [newPhoto, setNewPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // --- Calculations ---
  const activeLoansCount = loans.filter(l => ['active', 'overdue', 'renewed'].includes(l.status)).length;
  const totalPrincipal = loans.reduce((sum, l) => sum + Number(l.principal_amount), 0);

  // --- Fetch Data ---
  const fetchData = async () => {
    try {
      const [customerRes, loansRes] = await Promise.all([
        axios.get(`${API_URL}/api/customers/${id}`),
        axios.get(`${API_URL}/api/customers/${id}/loans`)
      ]);
      setCustomer(customerRes.data);
      setLoans(loansRes.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError('Failed to load customer data.');
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id, API_URL]);

  // --- Handlers ---
  const handleUpdateSuccess = (updatedCustomer) => {
    setCustomer(updatedCustomer);
    setIsEditing(false);
  };

  const handleLoanAdded = () => {
    setShowLoanForm(false); 
    fetchData(); 
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure? This will move the customer to Recycle Bin.")) return;
    try {
      await axios.delete(`${API_URL}/api/customers/${id}`);
      alert("Customer moved to Recycle Bin.");
      navigate('/customers');
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete customer.");
    }
  };

  // --- Photo Handlers ---
  const stopCameraStream = () => {
    if (streamRef.current) { 
        streamRef.current.getTracks().forEach(track => track.stop()); 
        streamRef.current = null; 
    }
    setIsCameraOn(false);
  };

  const handlePhotoModalClose = () => {
    stopCameraStream();
    setNewPhoto(null);
    setPhotoPreview(null);
    setShowPhotoModal(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0]; 
    if (file) { 
        setNewPhoto(file); 
        setPhotoPreview(URL.createObjectURL(file)); 
        stopCameraStream(); 
    }
  };

  const startCamera = async () => {
    stopCameraStream(); setNewPhoto(null); setPhotoPreview(null);
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true }); 
        streamRef.current = stream;
        // Small delay to ensure video element is rendered
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
                setNewPhoto(blob); 
                setPhotoPreview(canvas.toDataURL('image/jpeg')); 
                stopCameraStream(); 
            } 
        }, 'image/jpeg');
    }
  };

  const saveNewPhoto = async () => {
      if (!newPhoto) return alert("Please select or capture a photo first.");
      
      const formData = new FormData();
      
      // --- FIX: Changed field name from 'profileImage' to 'photo' to match backend ---
      formData.append('photo', newPhoto, 'profile.jpg'); 
      
      // We also need to send the required text fields, otherwise the backend validation might fail
      // or it might overwrite them with null.
      // Assuming your backend update logic handles partial updates or we re-send current data.
      // Based on your backend code: "UPDATE Customers SET ... WHERE id = $8 ..."
      // It expects name, phone, etc. Let's append current customer data to be safe.
      formData.append('name', customer.name);
      formData.append('phone_number', customer.phone_number);
      if(customer.address) formData.append('address', customer.address);
      if(customer.id_proof_type) formData.append('id_proof_type', customer.id_proof_type);
      if(customer.id_proof_number) formData.append('id_proof_number', customer.id_proof_number);
      if(customer.nominee_name) formData.append('nominee_name', customer.nominee_name);
      if(customer.nominee_relation) formData.append('nominee_relation', customer.nominee_relation);

      try {
          await axios.put(`${API_URL}/api/customers/${id}`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
          });
          alert("Profile picture updated!");
          handlePhotoModalClose();
          fetchData(); // Refresh to show new image
      } catch (err) {
          console.error("Photo upload failed", err);
          alert("Failed to upload photo. Ensure backend supports profile image updates.");
      }
  };

  // Helper to format currency
  const formatMoney = (amount) => `₹${Number(amount).toLocaleString('en-IN')}`;

  if (loading) return <div className="text-center mt-5"><div className="spinner-border text-primary"></div></div>;
  if (error) return <div className="alert alert-danger m-4">{error}</div>;
  if (!customer) return <div className="alert alert-warning m-4">Customer not found.</div>;

  return (
    <div className="container-fluid px-4 py-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      
      {/* 1. Header & Navigation */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <button className="btn btn-light bg-white border shadow-sm rounded-pill px-3" onClick={() => navigate(-1)}>
            <i className="bi bi-arrow-left me-2"></i>Back to List
        </button>
        
        {/* Only Delete button stays here (Admin only) */}
        {userRole === 'admin' && !isEditing && (
            <button className="btn btn-outline-danger rounded-pill px-3" onClick={handleDelete}>
            <i className="bi bi-trash me-2"></i>Delete Customer
            </button>
        )}
      </div>

      {isEditing ? (
        <div className="card shadow-sm border-0 rounded-4 p-4 bg-white">
           <h4 className="mb-4 fw-bold">Edit Customer Details</h4>
           <EditCustomerForm customer={customer} onUpdateSuccess={handleUpdateSuccess} onCancel={() => setIsEditing(false)} />
        </div>
      ) : (
        <div className="row g-4">
          
          {/* --- LEFT COL: Customer Profile (Sticky) --- */}
          <div className="col-lg-4 col-xl-3">
            <div className="sticky-top" style={{ top: '20px', zIndex: 1 }}>
                <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                    {/* Gradient Header */}
                    <div style={{ height: '100px', background: 'linear-gradient(135deg, #0d6efd 0%, #0dcaf0 100%)' }}></div>
                    
                    <div className="card-body text-center p-4 mt-n5">
                        
                        {/* --- PROFILE IMAGE WITH EDIT OVERLAY --- */}
                        <div 
                            className="mb-3 position-relative d-inline-block rounded-circle"
                            onMouseEnter={() => setHoverProfile(true)}
                            onMouseLeave={() => setHoverProfile(false)}
                            style={{ cursor: 'pointer' }}
                            onClick={() => setShowPhotoModal(true)}
                        >
                            {customer.customer_image_url ? (
                                <img 
                                    src={customer.customer_image_url} 
                                    alt={customer.name} 
                                    className="rounded-circle shadow" 
                                    style={{ width: '120px', height: '120px', objectFit: 'cover', border: '5px solid #fff' }} 
                                />
                            ) : (
                                <div className="rounded-circle bg-white text-primary d-flex align-items-center justify-content-center shadow" 
                                     style={{ width: '120px', height: '120px', fontSize: '3rem', fontWeight: 'bold', border: '5px solid #fff' }}>
                                    {customer.name.charAt(0).toUpperCase()}
                                </div>
                            )}

                            {/* Hover Overlay */}
                            <div 
                                className={`position-absolute top-0 start-0 w-100 h-100 rounded-circle d-flex justify-content-center align-items-center bg-dark ${hoverProfile ? 'opacity-50' : 'opacity-0'}`}
                                style={{ transition: 'opacity 0.2s', border: '5px solid transparent' }}
                            >
                                <i className="bi bi-camera-fill text-white fs-3"></i>
                            </div>
                        </div>

                        <h4 className="fw-bold text-dark mb-1">{customer.name}</h4>
                        <div className="badge bg-light text-secondary border mb-3">ID: {customer.id}</div>

                        {/* Contact Info Grid */}
                        <div className="text-start bg-light rounded-3 p-3 mb-3">
                            <div className="d-flex align-items-center mb-2">
                                <div className="bg-white p-2 rounded-circle me-3 text-primary"><i className="bi bi-telephone-fill"></i></div>
                                <div>
                                    <small className="text-muted d-block" style={{fontSize: '0.7rem'}}>PHONE</small>
                                    <span className="fw-bold">{customer.phone_number}</span>
                                </div>
                            </div>
                            <div className="d-flex align-items-center">
                                <div className="bg-white p-2 rounded-circle me-3 text-danger"><i className="bi bi-geo-alt-fill"></i></div>
                                <div>
                                    <small className="text-muted d-block" style={{fontSize: '0.7rem'}}>ADDRESS</small>
                                    <span className="fw-medium small lh-sm d-block">{customer.address || 'No address provided'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Additional Details */}
                        {(customer.id_proof_number || customer.nominee_name) && (
                            <ul className="list-group list-group-flush text-start small mb-4 rounded-3 border-0">
                                {customer.id_proof_number && (
                                    <li className="list-group-item d-flex justify-content-between px-0 bg-transparent border-bottom">
                                        <span className="text-muted">{customer.id_proof_type || 'ID Proof'}</span>
                                        <span className="fw-bold text-dark">{customer.id_proof_number}</span>
                                    </li>
                                )}
                                {customer.nominee_name && (
                                    <li className="list-group-item d-flex justify-content-between px-0 bg-transparent border-0">
                                        <span className="text-muted">Nominee ({customer.nominee_relation})</span>
                                        <span className="fw-bold text-dark">{customer.nominee_name}</span>
                                    </li>
                                )}
                            </ul>
                        )}

                        {/* --- ACTION BUTTONS (Moved Edit Here) --- */}
                        <div className="d-grid gap-2">
                            <button 
                                className="btn btn-primary fw-bold shadow-sm rounded-pill" 
                                onClick={() => setShowLoanForm(true)}
                            >
                                <i className="bi bi-plus-lg me-2"></i>New Pledge
                            </button>
                            <button 
                                className="btn btn-outline-dark fw-bold rounded-pill" 
                                onClick={() => setIsEditing(true)}
                            >
                                <i className="bi bi-pencil-square me-2"></i>Edit Details
                            </button>
                        </div>

                    </div>
                </div>
            </div>
          </div>

          {/* --- RIGHT COL: Activity & Stats --- */}
          <div className="col-lg-8 col-xl-9">
            
            {/* 2. Mini Financial Dashboard */}
            <div className="row g-3 mb-4">
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm h-100 py-2 border-start border-4 border-primary">
                        <div className="card-body">
                            <div className="text-muted small fw-bold text-uppercase">Total Pledges</div>
                            <h3 className="fw-bold text-dark mb-0">{loans.length}</h3>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm h-100 py-2 border-start border-4 border-success">
                        <div className="card-body">
                            <div className="text-muted small fw-bold text-uppercase">Active Loans</div>
                            <h3 className="fw-bold text-success mb-0">{activeLoansCount}</h3>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm h-100 py-2 border-start border-4 border-warning">
                        <div className="card-body">
                            <div className="text-muted small fw-bold text-uppercase">Lifetime Value</div>
                            <h3 className="fw-bold text-dark mb-0">{formatMoney(totalPrincipal)}</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Loan History Table */}
            <div className="card shadow-sm border-0 rounded-4">
                <div className="card-header bg-white py-3 px-4 border-bottom">
                    <h5 className="mb-0 fw-bold text-dark">Loan History</h5>
                </div>
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-light text-muted small text-uppercase">
                            <tr>
                                <th className="ps-4 py-3">Loan #</th>
                                <th>Pledge Date</th>
                                <th>Principal</th>
                                <th>Item Type</th>
                                <th>Status</th>
                                <th className="text-end pe-4">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loans.length === 0 ? (
                                <tr><td colSpan="6" className="text-center py-5 text-muted">No loans found for this customer.</td></tr>
                            ) : (
                                loans.map(loan => (
                                    <tr key={loan.loan_id} style={{cursor: 'pointer'}} onClick={() => navigate(`/loans/${loan.loan_id}`)}>
                                        <td className="ps-4 fw-bold text-primary">
                                            #{loan.book_loan_number || loan.loan_id}
                                        </td>
                                        <td className="text-secondary">{new Date(loan.pledge_date).toLocaleDateString()}</td>
                                        <td className="fw-bold text-dark">{formatMoney(loan.principal_amount)}</td>
                                        <td>
                                            <span className="badge bg-light text-secondary border text-capitalize">
                                                {loan.item_type}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge rounded-pill px-3 py-2 ${
                                                loan.status === 'active' ? 'bg-success bg-opacity-10 text-success' : 
                                                loan.status === 'overdue' ? 'bg-danger bg-opacity-10 text-danger' :
                                                loan.status === 'paid' ? 'bg-secondary bg-opacity-10 text-secondary' : 
                                                'bg-warning bg-opacity-10 text-dark'
                                            }`}>
                                                {loan.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="text-end pe-4">
                                            <button 
                                                className="btn btn-sm btn-outline-primary rounded-pill px-3 fw-bold"
                                                onClick={(e) => {
                                                    e.stopPropagation(); 
                                                    navigate(`/loans/${loan.loan_id}`);
                                                }}
                                            >
                                                View Details <i className="bi bi-chevron-right ms-1"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

          </div>
        </div>
      )}

      {/* --- MODAL FOR CREATE PLEDGE --- */}
      {showLoanForm && (
          <div style={modalOverlayStyle}>
              <div style={modalContentStyle} className="animate__animated animate__zoomIn">
                  <div className="d-flex justify-content-between align-items-center p-3 border-bottom bg-light rounded-top-4">
                      <h5 className="m-0 fw-bold ps-2 text-dark">New Pledge Entry</h5>
                      <button type="button" className="btn-close" onClick={() => setShowLoanForm(false)}></button>
                  </div>
                  <div className="p-2">
                    <LoanForm 
                        customerId={id} 
                        onLoanAdded={handleLoanAdded} 
                        onCancel={() => setShowLoanForm(false)} 
                    />
                  </div>
              </div>
          </div>
      )}

      {/* --- MODAL FOR PHOTO UPDATE --- */}
      {showPhotoModal && (
          <div style={modalOverlayStyle}>
              <div style={{ ...modalContentStyle, maxWidth: '500px' }} className="animate__animated animate__zoomIn">
                  <div className="modal-header p-3 border-bottom bg-light">
                      <h5 className="m-0 fw-bold">Update Profile Photo</h5>
                      <button type="button" className="btn-close" onClick={handlePhotoModalClose}></button>
                  </div>
                  <div className="modal-body p-4 text-center">
                        <div className="d-flex justify-content-center gap-3 mb-4">
                            <button 
                                className={`btn ${photoSource === 'upload' ? 'btn-primary' : 'btn-outline-primary'} flex-grow-1`}
                                onClick={() => { setPhotoSource('upload'); stopCameraStream(); }}
                            >
                                <i className="bi bi-upload me-2"></i> Upload File
                            </button>
                            <button 
                                className={`btn ${photoSource === 'capture' ? 'btn-primary' : 'btn-outline-primary'} flex-grow-1`}
                                onClick={() => { setPhotoSource('capture'); startCamera(); }}
                            >
                                <i className="bi bi-camera-fill me-2"></i> Camera
                            </button>
                        </div>

                        <div className="bg-light rounded p-3 mb-3 d-flex align-items-center justify-content-center" style={{ minHeight: '250px' }}>
                            {photoSource === 'upload' ? (
                                <div className="w-100">
                                    <input type="file" className="form-control mb-3" accept="image/*" onChange={handleFileChange} />
                                    {photoPreview && <img src={photoPreview} alt="Preview" className="img-thumbnail rounded-circle" style={{width:'150px', height:'150px', objectFit:'cover'}} />}
                                </div>
                            ) : (
                                <div className="position-relative w-100">
                                    <video ref={videoRef} autoPlay playsInline muted className="w-100 rounded border" style={{ maxHeight: '250px', display: isCameraOn ? 'block' : 'none' }}></video>
                                    {!isCameraOn && !photoPreview && <p className="text-muted">Starting camera...</p>}
                                    {photoPreview && !isCameraOn && <img src={photoPreview} alt="Captured" className="img-thumbnail rounded-circle" style={{width:'150px', height:'150px', objectFit:'cover'}} />}
                                    
                                    {isCameraOn && (
                                        <button className="btn btn-danger position-absolute bottom-0 start-50 translate-middle-x mb-2 rounded-circle p-3" onClick={capturePhoto}>
                                            <i className="bi bi-circle-fill"></i>
                                        </button>
                                    )}
                                    <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
                                </div>
                            )}
                        </div>

                        <div className="d-flex gap-2">
                            <button className="btn btn-secondary flex-grow-1" onClick={handlePhotoModalClose}>Cancel</button>
                            <button className="btn btn-success flex-grow-1" onClick={saveNewPhoto}>Save Photo</button>
                        </div>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default CustomerPage;