// src/pages/SettingsPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

const SettingsPage = () => {
  // Context State
  const [branches, setBranches] = useState([]);
  const [selectedContext, setSelectedContext] = useState('global'); // 'global' or branchId

  // Form State
  const [formData, setFormData] = useState({
    business_name: '',
    address: '',
    phone_number: '',
    license_number: '',
    navbar_display_mode: 'both',
    existingLogoUrl: ''
  });
  
  const [logoFile, setLogoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // 1. Fetch Branches & Initial Global Settings
  useEffect(() => {
    fetchBranches();
    fetchSettings(); // Default load
  }, []);

  // 2. Refetch when context changes
  useEffect(() => {
    if (selectedContext === 'global') {
      fetchSettings();
    } else {
      fetchBranchDetails(selectedContext);
    }
    setMessage(null);
  }, [selectedContext]);

  const fetchBranches = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/branches`);
      setBranches(res.data);
    } catch (err) {
      console.error("Error loading branches", err);
    }
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const res = await axios.get(`${API_URL}/api/settings`, { headers });
      if (res.data) {
        setFormData({
          business_name: res.data.business_name || '',
          address: res.data.address || '',
          phone_number: res.data.phone_number || '',
          license_number: res.data.license_number || '',
          navbar_display_mode: res.data.navbar_display_mode || 'both',
          existingLogoUrl: res.data.logo_url || ''
        });
        setPreviewUrl(res.data.logo_url);
      }
    } catch (err) {
      console.error("Error fetching settings", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranchDetails = async (branchId) => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/branches/${branchId}`);
      // Merge branch details with global business name/logo for display consistency
      // (assuming branches don't have their own logo/name in DB, we keep current state for those or fetch global to show read-only)
      
      // We only update the editable fields for branch
      setFormData(prev => ({
        ...prev,
        // Keep global name/logo in state (or fetch global if needed), but populate branch specific fields
        address: res.data.address || '',
        phone_number: res.data.phone_number || '',
        license_number: res.data.license_number || '', // Assuming branch model has this or you added it
        // branch_code: res.data.branch_code // if needed
      }));
    } catch (err) {
      console.error("Error fetching branch details", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (selectedContext === 'global') {
        // --- UPDATE GLOBAL SETTINGS ---
        const data = new FormData();
        data.append('business_name', formData.business_name);
        data.append('address', formData.address);
        data.append('phone_number', formData.phone_number);
        data.append('license_number', formData.license_number);
        data.append('navbar_display_mode', formData.navbar_display_mode);
        data.append('existingLogoUrl', formData.existingLogoUrl);
        if (logoFile) {
          data.append('logo', logoFile);
        }

        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };
        await axios.put(`${API_URL}/api/settings`, data, { headers });
        setMessage({ type: 'success', text: 'Global Settings updated successfully!' });
      } else {
        // --- UPDATE SPECIFIC BRANCH ---
        // We only send the fields relevant to the branch table
        const branchPayload = {
          address: formData.address,
          phone_number: formData.phone_number,
          // If your branch table has license_number, include it. Otherwise, remove.
          license_number: formData.license_number 
        };
        
        await axios.put(`${API_URL}/api/branches/${selectedContext}`, branchPayload);
        setMessage({ type: 'success', text: 'Branch Profile updated successfully!' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'danger', text: 'Failed to update settings.' });
    } finally {
      setLoading(false);
    }
  };

  const isGlobal = selectedContext === 'global';

  return (
    <div className="container mt-4 mb-5">
      <div className="card shadow border-0 rounded-3">
        <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
          <h4 className="mb-0 fw-bold text-dark"><i className="bi bi-sliders me-2"></i>Configuration</h4>
          
          {/* CONTEXT SELECTOR */}
          <div className="d-flex align-items-center">
            <span className="text-muted small me-2 fw-bold">EDITING:</span>
            <select 
              className="form-select form-select-sm fw-bold border-primary text-primary" 
              style={{width: '250px'}}
              value={selectedContext}
              onChange={(e) => setSelectedContext(e.target.value)}
            >
              <option value="global">🏢 Head Office (Global Defaults)</option>
              <option disabled>--------------------------------</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>📍 {b.branch_name} ({b.branch_code})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="card-body p-4">
          
          {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

          <form onSubmit={handleSubmit}>
            <div className="row g-4">
              
              {/* --- LOGO SECTION (Read-Only if Branch) --- */}
              <div className="col-md-4 text-center">
                <div className="mb-3">
                  <label className="form-label fw-bold">Business Logo { !isGlobal && <span className="badge bg-secondary">Global</span> }</label>
                  <div className={`border rounded p-3 ${isGlobal ? 'bg-light' : 'bg-secondary bg-opacity-10'} d-flex justify-content-center align-items-center`} style={{height: '200px'}}>
                    {previewUrl ? (
                      <img src={previewUrl} alt="Logo Preview" style={{maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', opacity: isGlobal ? 1 : 0.6}} />
                    ) : (
                      <span className="text-muted">No Logo Selected</span>
                    )}
                  </div>
                </div>
                {isGlobal && (
                  <>
                    <input type="file" className="form-control" accept="image/*" onChange={handleFileChange} />
                    <small className="text-muted d-block mt-2">Recommended: Square PNG with transparent background.</small>
                  </>
                )}
              </div>

              {/* --- DETAILS SECTION --- */}
              <div className="col-md-8">
                
                {/* Business Name (Global Only) */}
                <div className="mb-3">
                  <label className="form-label fw-bold">Business Name { !isGlobal && <span className="badge bg-secondary">Global</span> }</label>
                  <input 
                    type="text" 
                    name="business_name" 
                    className="form-control" 
                    value={formData.business_name} 
                    onChange={handleChange} 
                    disabled={!isGlobal} 
                    required 
                  />
                </div>

                {/* Location Details (Editable for Both) */}
                <div className="card bg-light border-0 p-3 mb-3">
                  <h6 className="fw-bold text-primary mb-3">
                    <i className="bi bi-geo-alt-fill me-2"></i>
                    {isGlobal ? "Head Office Contact Info" : "Branch Contact Info"}
                  </h6>
                  
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">Phone Number</label>
                      <input type="text" name="phone_number" className="form-control" value={formData.phone_number} onChange={handleChange} />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">License Number</label>
                      <input type="text" name="license_number" className="form-control" value={formData.license_number} onChange={handleChange} />
                    </div>
                  </div>

                  <div className="mb-0">
                    <label className="form-label fw-bold">Address</label>
                    <textarea name="address" className="form-control" rows="3" value={formData.address} onChange={handleChange}></textarea>
                  </div>
                </div>

                {/* Navbar Mode (Global Only) */}
                {isGlobal && (
                  <div className="mb-4">
                    <label className="form-label fw-bold d-block">Navbar Display Style</label>
                    <div className="d-flex flex-wrap gap-4 border p-3 rounded bg-white">
                      <div className="form-check">
                        <input className="form-check-input" type="radio" name="navbar_display_mode" id="navModeBoth" value="both" checked={formData.navbar_display_mode === 'both'} onChange={handleChange} />
                        <label className="form-check-label fw-500" htmlFor="navModeBoth">Show Logo & Name</label>
                      </div>
                      <div className="form-check">
                        <input className="form-check-input" type="radio" name="navbar_display_mode" id="navModeLogo" value="logo_only" checked={formData.navbar_display_mode === 'logo_only'} onChange={handleChange} />
                        <label className="form-check-label fw-500" htmlFor="navModeLogo">Show Logo Only</label>
                      </div>
                      <div className="form-check">
                        <input className="form-check-input" type="radio" name="navbar_display_mode" id="navModeName" value="name_only" checked={formData.navbar_display_mode === 'name_only'} onChange={handleChange} />
                        <label className="form-check-label fw-500" htmlFor="navModeName">Show Name Only</label>
                      </div>
                    </div>
                  </div>
                )}

                <div className="d-grid">
                  <button type="submit" className="btn btn-primary btn-lg shadow-sm" disabled={loading}>
                    {loading ? 'Saving...' : `Save ${isGlobal ? 'Global' : 'Branch'} Settings`}
                  </button>
                </div>
              </div>

            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;