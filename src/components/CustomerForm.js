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
  const [showKyc, setShowKyc] = useState(false); // Toggle for "Add Later"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = (e) => {
    setPhoto(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const data = new FormData();
    // Standard fields
    data.append('name', formData.name);
    data.append('phone_number', formData.phone_number);
    data.append('address', formData.address);
    
    // Only append KYC if the toggle is ON
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
      // FIXED: Added '/api' to the URL
      const response = await axios.post(`${API_URL}/api/customers`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      // Reset form
      setFormData({
        name: '', phone_number: '', address: '',
        id_proof_type: 'Aadhaar', id_proof_number: '',
        nominee_name: '', nominee_relation: ''
      });
      setPhoto(null);
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
    <div className="card shadow-sm border-0 mb-4">
      <div className="card-header bg-white py-3 border-bottom-0">
        <h5 className="text-primary fw-bold mb-0"><i className="bi bi-person-plus-fill me-2"></i>Add New Customer</h5>
      </div>
      <div className="card-body p-4">
        {error && <div className="alert alert-danger">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          {/* --- SECTION 1: BASIC INFO --- */}
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <label className="form-label fw-medium">Full Name <span className="text-danger">*</span></label>
              <input 
                type="text" 
                className="form-control form-control-lg" 
                name="name" 
                placeholder="e.g. Rajesh Kumar"
                value={formData.name} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-medium">Phone Number <span className="text-danger">*</span></label>
              <input 
                type="tel" 
                className="form-control form-control-lg" 
                name="phone_number" 
                placeholder="e.g. 9876543210"
                value={formData.phone_number} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div className="col-12">
              <label className="form-label fw-medium">Address</label>
              <textarea 
                className="form-control" 
                name="address" 
                rows="2"
                value={formData.address} 
                onChange={handleChange} 
              />
            </div>
            <div className="col-12">
               <label className="form-label fw-medium">Customer Photo (Optional)</label>
               <input type="file" className="form-control" accept="image/*" onChange={handlePhotoChange} />
            </div>
          </div>

          {/* --- TOGGLE FOR KYC --- */}
          <div className="form-check form-switch mb-4 p-3 bg-light rounded">
            <input 
                className="form-check-input" 
                type="checkbox" 
                id="kycToggle" 
                checked={showKyc}
                onChange={(e) => setShowKyc(e.target.checked)} 
            />
            <label className="form-check-label fw-bold ms-2" htmlFor="kycToggle">
                Add ID Proof & Nominee Details Now?
            </label>
            <div className="text-muted small ms-2">You can always add these later in the customer profile.</div>
          </div>

          {/* --- SECTION 2: KYC (HIDDEN BY DEFAULT) --- */}
          {showKyc && (
             <div className="row g-3 mb-4 border-start border-4 border-primary ps-3 ms-1">
                <div className="col-md-6">
                    <label className="form-label">ID Proof Type</label>
                    <select className="form-select" name="id_proof_type" value={formData.id_proof_type} onChange={handleChange}>
                    <option value="Aadhaar">Aadhaar Card</option>
                    <option value="PAN">PAN Card</option>
                    <option value="Voter ID">Voter ID</option>
                    <option value="Driving License">Driving License</option>
                    <option value="Ration Card">Ration Card</option>
                    </select>
                </div>
                <div className="col-md-6">
                    <label className="form-label">ID Number</label>
                    <input type="text" className="form-control" name="id_proof_number" value={formData.id_proof_number} onChange={handleChange} />
                </div>
                <div className="col-md-6">
                    <label className="form-label">Nominee Name</label>
                    <input type="text" className="form-control" name="nominee_name" value={formData.nominee_name} onChange={handleChange} />
                </div>
                <div className="col-md-6">
                    <label className="form-label">Nominee Relation</label>
                    <input type="text" className="form-control" name="nominee_relation" value={formData.nominee_relation} onChange={handleChange} placeholder="e.g. Wife" />
                </div>
             </div>
          )}

          <div className="d-grid">
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
              {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-check-circle-fill me-2"></i>}
              Save Customer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerForm;