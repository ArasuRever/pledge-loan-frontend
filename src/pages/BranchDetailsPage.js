import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL;

const BranchDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    branch_name: '',
    branch_code: '',
    address: '',
    phone_number: '',
    is_active: true
  });

  useEffect(() => {
    const fetchBranch = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/branches/${id}`);
        setFormData(res.data);
      } catch (err) {
        alert("Failed to load branch data");
        navigate('/manage-branches');
      }
    };
    fetchBranch();
  }, [id, navigate]);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/api/branches/${id}`, formData);
      alert("Branch updated successfully!");
      navigate('/manage-branches');
    } catch (err) {
      alert("Error updating branch");
    }
  };

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow">
            <div className="card-header bg-warning">
              <h5 className="mb-0">Edit Branch: {formData.branch_name}</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Branch Name</label>
                  <input type="text" name="branch_name" className="form-control" value={formData.branch_name} required onChange={handleChange} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Branch Code</label>
                  <input type="text" name="branch_code" className="form-control text-uppercase" value={formData.branch_code} required onChange={handleChange} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Phone Number</label>
                  <input type="text" name="phone_number" className="form-control" value={formData.phone_number || ''} onChange={handleChange} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Address</label>
                  <textarea name="address" className="form-control" rows="3" value={formData.address || ''} onChange={handleChange}></textarea>
                </div>
                
                <div className="form-check mb-4">
                    <input className="form-check-input" type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} id="activeCheck" />
                    <label className="form-check-label" htmlFor="activeCheck">Branch is Active</label>
                </div>

                <div className="d-flex justify-content-between">
                    <button type="button" className="btn btn-secondary" onClick={() => navigate('/manage-branches')}>Cancel</button>
                    <button type="submit" className="btn btn-primary">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BranchDetailsPage;