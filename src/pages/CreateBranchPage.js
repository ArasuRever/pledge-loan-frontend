import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL;

const CreateBranchPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    branch_name: '',
    branch_code: '',
    address: '',
    phone_number: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/branches`, formData);
      navigate('/manage-branches'); // Redirect back to list
    } catch (err) {
      setError(err.response?.data?.error || "Error creating branch");
    }
  };

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Create New Branch</h5>
            </div>
            <div className="card-body">
              {error && <div className="alert alert-danger">{error}</div>}
              
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Branch Name</label>
                  <input type="text" name="branch_name" className="form-control" required onChange={handleChange} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Branch Code (e.g., SLM, BLR)</label>
                  <input type="text" name="branch_code" className="form-control text-uppercase" required onChange={handleChange} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Phone Number</label>
                  <input type="text" name="phone_number" className="form-control" onChange={handleChange} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Address</label>
                  <textarea name="address" className="form-control" rows="3" onChange={handleChange}></textarea>
                </div>
                <button type="submit" className="btn btn-success w-100">Create Branch</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateBranchPage;