// src/components/CustomerForm.js
import React, { useState } from 'react';
import axios from 'axios';

const CustomerForm = ({ onCustomerAdded }) => {
  // --- RESTORED API_URL CONSTANT ---
  const API_URL = process.env.REACT_APP_API_URL;

  const [formData, setFormData] = useState({
    name: '',
    phone_number: '',
    address: '',
    // New KYC Fields
    id_proof_type: 'Aadhaar', // Default
    id_proof_number: '',
    nominee_name: '',
    nominee_relation: '',
  });
  const [photo, setPhoto] = useState(null);
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
    // New KYC fields
    data.append('id_proof_type', formData.id_proof_type);
    data.append('id_proof_number', formData.id_proof_number);
    data.append('nominee_name', formData.nominee_name);
    data.append('nominee_relation', formData.nominee_relation);
    
    if (photo) {
      data.append('photo', photo);
    }

    try {
      // --- USING API_URL HERE ---
      const response = await axios.post(`${API_URL}/customers`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Reset form
      setFormData({
        name: '', phone_number: '', address: '',
        id_proof_type: 'Aadhaar', id_proof_number: '',
        nominee_name: '', nominee_relation: ''
      });
      setPhoto(null);
      
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
    <div className="card shadow-sm p-4 mb-4">
      <h4 className="mb-3 text-primary"><i className="bi bi-person-plus-fill me-2"></i>Add New Customer</h4>
      {error && <div className="alert alert-danger">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="row">
          {/* Basic Details */}
          <div className="col-md-4 mb-3">
            <label className="form-label">Name *</label>
            <input type="text" className="form-control" name="name" value={formData.name} onChange={handleChange} required />
          </div>
          <div className="col-md-4 mb-3">
            <label className="form-label">Phone Number *</label>
            <input type="text" className="form-control" name="phone_number" value={formData.phone_number} onChange={handleChange} required />
          </div>
          <div className="col-md-4 mb-3">
            <label className="form-label">Address</label>
            <input type="text" className="form-control" name="address" value={formData.address} onChange={handleChange} />
          </div>
        </div>

        <div className="row">
          {/* KYC Details (New Section) */}
          <div className="col-md-4 mb-3">
            <label className="form-label">ID Proof Type</label>
            <select className="form-select" name="id_proof_type" value={formData.id_proof_type} onChange={handleChange}>
              <option value="Aadhaar">Aadhaar Card</option>
              <option value="PAN">PAN Card</option>
              <option value="Voter ID">Voter ID</option>
              <option value="Driving License">Driving License</option>
              <option value="Ration Card">Ration Card</option>
            </select>
          </div>
          <div className="col-md-4 mb-3">
            <label className="form-label">ID Proof Number</label>
            <input type="text" className="form-control" name="id_proof_number" value={formData.id_proof_number} onChange={handleChange} placeholder="e.g. 1234 5678 9012" />
          </div>
          <div className="col-md-4 mb-3">
             <label className="form-label">Customer Photo</label>
             <input type="file" className="form-control" accept="image/*" onChange={handlePhotoChange} />
          </div>
        </div>

        <div className="row">
          {/* Nominee Details (New Section) */}
          <div className="col-md-6 mb-3">
            <label className="form-label">Nominee Name</label>
            <input type="text" className="form-control" name="nominee_name" value={formData.nominee_name} onChange={handleChange} />
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label">Nominee Relation</label>
            <input type="text" className="form-control" name="nominee_relation" value={formData.nominee_relation} onChange={handleChange} placeholder="e.g. Wife, Son, Father" />
          </div>
        </div>

        <button type="submit" className="btn btn-success w-100" disabled={loading}>
          {loading ? 'Adding...' : 'Add Customer'}
        </button>
      </form>
    </div>
  );
};

export default CustomerForm;