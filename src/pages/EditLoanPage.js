// src/pages/EditLoanPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const EditLoanPage = () => {
  const API_URL = process.env.REACT_APP_API_URL;
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    book_loan_number: '',
    interest_rate: '',
    pledge_date: '',
    due_date: '',
    item_type: 'gold',
    description: '',
    quality: '',
    // New Fields
    gross_weight: '',
    net_weight: '',
    purity: '',
    appraised_value: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Format date for input type="date" (YYYY-MM-DD)
  const formatDateForInput = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toISOString().split('T')[0];
  };

  useEffect(() => {
    const fetchLoan = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/loans/${id}`);
        const data = response.data.loanDetails;
        
        setFormData({
          book_loan_number: data.book_loan_number,
          interest_rate: data.interest_rate,
          pledge_date: formatDateForInput(data.pledge_date),
          due_date: formatDateForInput(data.due_date),
          item_type: data.item_type,
          description: data.description,
          quality: data.quality || '',
          // Handle new fields (with fallbacks)
          gross_weight: data.gross_weight || data.weight || '',
          net_weight: data.net_weight || '',
          purity: data.purity || '',
          appraised_value: data.appraised_value || ''
        });
        setLoading(false);
      } catch (err) {
        console.error("Error fetching loan:", err);
        setError('Failed to load loan details.');
        setLoading(false);
      }
    };
    fetchLoan();
  }, [id, API_URL]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Auto-fill Net Weight if empty when Gross Weight changes
  const handleGrossWeightChange = (e) => {
      const gWeight = e.target.value;
      setFormData(prev => {
          // Only auto-fill if net_weight is currently empty
          if (prev.net_weight === '') {
              return { ...prev, gross_weight: gWeight, net_weight: gWeight };
          }
          return { ...prev, gross_weight: gWeight };
      });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Send data as JSON (assuming no photo update needed here, typically photos aren't edited this way)
      // If you need photo updates, we'd convert to FormData
      await axios.put(`${API_URL}/api/loans/${id}`, formData);
      alert('Loan updated successfully.');
      navigate(`/loans/${id}`);
    } catch (err) {
      console.error("Update Error:", err);
      alert(err.response?.data?.error || 'Failed to update loan.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center mt-5"><div className="spinner-border text-primary"></div></div>;
  if (error) return <div className="alert alert-danger m-4">{error}</div>;

  return (
    <div className="container mt-4" style={{maxWidth: '800px'}}>
      <div className="card shadow-sm">
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

            <div className="d-flex justify-content-end gap-2">
              <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
              <button type="submit" className="btn btn-primary px-4" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditLoanPage;