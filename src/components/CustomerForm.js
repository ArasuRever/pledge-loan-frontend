// src/components/CustomerForm.js
import React, { useState } from 'react';
import axios from 'axios';

const CustomerForm = ({ onCustomerAdded }) => {
  const API_URL = process.env.REACT_APP_API_URL;

  const [formData, setFormData] = useState({
    name: '',
    phone_number: '',
    address: '',
    id_proof_type: 'Aadhaar', 
    id_proof_number: '',
    nominee_name: '',
    nominee_relation: '',
  });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null); // For Image Preview
  const [showKyc, setShowKyc] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const data = new FormData();
    data.append('name', formData.name);
    data.append('phone_number', formData.phone_number);
    data.append('address', formData.address);
    
    if (showKyc) {
        data.append('id_proof_type', formData.id_proof_type);
        data.append('id_proof_number', formData.id_proof_number);
        data.append('nominee_name', formData.nominee_name);
        data.append('nominee_relation', formData.nominee_relation);
    }

    if (photo) {
      data.append('photo', photo);
    }

    try {
      const response = await axios.post(`${API_URL}/api/customers`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      // Reset Form
      setFormData({
        name: '', phone_number: '', address: '',
        id_proof_type: 'Aadhaar', id_proof_number: '',
        nominee_name: '', nominee_relation: ''
      });
      setPhoto(null);
      setPhotoPreview(null);
      setShowKyc(false);
      
      if (onCustomerAdded) onCustomerAdded(response.data);
      alert('Customer added successfully!');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Error adding customer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
      {/* HEADER */}
      <div className="card-header bg-primary bg-gradient text-white py-3">
        <h5 className="mb-0 fw-bold d-flex align-items-center">
          <i className="bi bi-person-plus-fill me-2 fs-4"></i> New Registration
        </h5>
      </div>

      <div className="card-body p-4 bg-light bg-opacity-25">
        {error && (
          <div className="alert alert-danger d-flex align-items-center small py-2 mb-3" role="alert">
            <i className="bi bi-exclamation-circle-fill me-2"></i>
            <div>{error}</div>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          {/* PHOTO UPLOAD SECTION */}
          <div className="d-flex justify-content-center mb-4">
            <div className="position-relative">
                <div 
                    className="rounded-circle border border-3 border-white shadow-sm d-flex align-items-center justify-content-center overflow-hidden bg-white"
                    style={{ width: '110px', height: '110px' }}
                >
                    {photoPreview ? (
                        <img src={photoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <i className="bi bi-person-bounding-box text-secondary opacity-25" style={{ fontSize: '3rem' }}></i>
                    )}
                </div>
                {/* Camera Button Overlay */}
                <label 
                    className="btn btn-sm btn-primary rounded-circle position-absolute bottom-0 end-0 shadow-sm border border-2 border-white d-flex align-items-center justify-content-center" 
                    style={{ width: '36px', height: '36px', cursor: 'pointer' }}
                    title="Upload Photo"
                >
                    <i className="bi bi-camera-fill small"></i>
                    <input type="file" hidden accept="image/*" onChange={handlePhotoChange} />
                </label>
            </div>
          </div>

          {/* BASIC INFO - FLOATING LABELS */}
          <div className="form-floating mb-3">
            <input 
              type="text" 
              className="form-control" 
              id="name" 
              name="name" 
              placeholder="Full Name" 
              value={formData.name} 
              onChange={handleChange} 
              required 
            />
            <label htmlFor="name" className="text-muted"><i className="bi bi-person me-1"></i> Full Name <span className="text-danger">*</span></label>
          </div>

          <div className="form-floating mb-3">
            <input 
              type="tel" 
              className="form-control" 
              id="phone" 
              name="phone_number" 
              placeholder="Phone Number" 
              value={formData.phone_number} 
              onChange={handleChange} 
              required 
            />
            <label htmlFor="phone" className="text-muted"><i className="bi bi-telephone me-1"></i> Phone Number <span className="text-danger">*</span></label>
          </div>

          <div className="form-floating mb-4">
            <textarea 
              className="form-control" 
              id="address" 
              name="address" 
              placeholder="Address" 
              style={{ height: '80px', resize: 'none' }} 
              value={formData.address} 
              onChange={handleChange} 
            />
            <label htmlFor="address" className="text-muted"><i className="bi bi-geo-alt me-1"></i> Address</label>
          </div>

          {/* KYC TOGGLE */}
          <div className="bg-white p-3 rounded-3 border mb-3 shadow-sm">
            <div className="form-check form-switch d-flex align-items-center justify-content-between ps-0">
                <label className="form-check-label fw-bold small text-muted text-uppercase mb-0" htmlFor="kycToggle">
                    <i className="bi bi-card-heading me-1"></i> Add KYC Details
                </label>
                <input 
                    className="form-check-input ms-auto" 
                    type="checkbox" 
                    id="kycToggle" 
                    checked={showKyc}
                    onChange={(e) => setShowKyc(e.target.checked)} 
                    style={{ cursor: 'pointer', width: '2.5em', height: '1.25em' }}
                />
            </div>
          </div>

          {/* KYC FIELDS (COLLAPSIBLE) */}
          {showKyc && (
             <div className="row g-2 mb-4 animate__animated animate__fadeIn">
                <div className="col-12">
                    <div className="form-floating">
                        <select className="form-select" id="proofType" name="id_proof_type" value={formData.id_proof_type} onChange={handleChange}>
                            <option value="Aadhaar">Aadhaar Card</option>
                            <option value="PAN">PAN Card</option>
                            <option value="Voter ID">Voter ID</option>
                            <option value="Driving License">Driving License</option>
                            <option value="Ration Card">Ration Card</option>
                        </select>
                        <label htmlFor="proofType">Proof Type</label>
                    </div>
                </div>
                <div className="col-12">
                    <div className="form-floating">
                        <input type="text" className="form-control" id="proofNo" name="id_proof_number" placeholder="ID Number" value={formData.id_proof_number} onChange={handleChange} />
                        <label htmlFor="proofNo">ID Number</label>
                    </div>
                </div>
                <div className="col-6">
                    <div className="form-floating">
                        <input type="text" className="form-control" id="nominee" name="nominee_name" placeholder="Nominee" value={formData.nominee_name} onChange={handleChange} />
                        <label htmlFor="nominee">Nominee</label>
                    </div>
                </div>
                <div className="col-6">
                    <div className="form-floating">
                        <input type="text" className="form-control" id="relation" name="nominee_relation" placeholder="Relation" value={formData.nominee_relation} onChange={handleChange} />
                        <label htmlFor="relation">Relation</label>
                    </div>
                </div>
             </div>
          )}

          {/* SUBMIT BUTTON */}
          <button type="submit" className="btn btn-primary w-100 py-3 fw-bold shadow-sm rounded-3" disabled={loading}>
            {loading ? (
                <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Saving...
                </>
            ) : (
                <>
                    <i className="bi bi-check-lg me-2"></i> Create Customer
                </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CustomerForm;