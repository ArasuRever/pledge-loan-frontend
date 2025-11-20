// src/components/EditCustomerForm.js
import React, { useState } from 'react';
import axios from 'axios';

const EditCustomerForm = ({ customer, onUpdateSuccess, onCancel }) => {
  // --- RESTORED API_URL CONSTANT ---
  const API_URL = process.env.REACT_APP_API_URL;

  const [formData, setFormData] = useState({
    name: customer.name || '',
    phone_number: customer.phone_number || '',
    address: customer.address || '',
    // New Fields with fallback
    id_proof_type: customer.id_proof_type || 'Aadhaar',
    id_proof_number: customer.id_proof_number || '',
    nominee_name: customer.nominee_name || '',
    nominee_relation: customer.nominee_relation || ''
  });
  const [photo, setPhoto] = useState(null);
  const [removeCurrentImage, setRemoveCurrentImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = (e) => {
    setPhoto(e.target.files[0]);
    setRemoveCurrentImage(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const data = new FormData();
    data.append('name', formData.name);
    data.append('phone_number', formData.phone_number);
    data.append('address', formData.address);
    // Append New Fields
    data.append('id_proof_type', formData.id_proof_type);
    data.append('id_proof_number', formData.id_proof_number);
    data.append('nominee_name', formData.nominee_name);
    data.append('nominee_relation', formData.nominee_relation);

    if (photo) {
      data.append('photo', photo);
    }
    if (removeCurrentImage) {
      data.append('removeCurrentImage', 'true');
    }

    try {
      // --- USING API_URL HERE ---
      const response = await axios.put(`${API_URL}/customers/${customer.id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onUpdateSuccess(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to update customer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card shadow-sm p-4 mb-4">
      <h5 className="mb-3">Edit Customer: {customer.name}</h5>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
        
        <div className="row">
            <div className="col-md-4 mb-3">
                <label className="form-label">Name</label>
                <input type="text" className="form-control" name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div className="col-md-4 mb-3">
                <label className="form-label">Phone</label>
                <input type="text" className="form-control" name="phone_number" value={formData.phone_number} onChange={handleChange} required />
            </div>
            <div className="col-md-4 mb-3">
                <label className="form-label">Address</label>
                <input type="text" className="form-control" name="address" value={formData.address} onChange={handleChange} />
            </div>
        </div>

        <div className="row">
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
                <label className="form-label">ID Number</label>
                <input type="text" className="form-control" name="id_proof_number" value={formData.id_proof_number} onChange={handleChange} />
            </div>
             <div className="col-md-4 mb-3">
                <label className="form-label">Photo</label>
                <input type="file" className="form-control" onChange={handlePhotoChange} />
                 {customer.customer_image_url && !photo && !removeCurrentImage && (
                  <div className="form-check mt-2">
                    <input className="form-check-input" type="checkbox" id="removeImage" onChange={(e) => setRemoveCurrentImage(e.target.checked)} />
                    <label className="form-check-label" htmlFor="removeImage">Remove current photo</label>
                  </div>
                )}
            </div>
        </div>

         <div className="row">
            <div className="col-md-6 mb-3">
                <label className="form-label">Nominee Name</label>
                <input type="text" className="form-control" name="nominee_name" value={formData.nominee_name} onChange={handleChange} />
            </div>
            <div className="col-md-6 mb-3">
                <label className="form-label">Nominee Relation</label>
                <input type="text" className="form-control" name="nominee_relation" value={formData.nominee_relation} onChange={handleChange} />
            </div>
        </div>

        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
        </div>
      </form>
    </div>
  );
};

export default EditCustomerForm;