// src/pages/SettingsPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

const SettingsPage = () => {
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

  useEffect(() => {
    const fetchSettings = async () => {
      try {
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
          if (res.data.logo_url) setPreviewUrl(res.data.logo_url);
        }
      } catch (err) {
        console.error("Error fetching settings", err);
      }
    };
    fetchSettings();
  }, []);

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

    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      await axios.put(`${API_URL}/api/settings`, data, { headers });
      setMessage({ type: 'success', text: 'Settings updated successfully! Refresh page to see changes.' });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'danger', text: 'Failed to update settings.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4 mb-5">
      <div className="card shadow border-0 rounded-3">
        <div className="card-header bg-white py-3">
          <h4 className="mb-0 fw-bold text-dark"><i className="bi bi-sliders me-2"></i>Business Settings</h4>
        </div>
        <div className="card-body p-4">
          
          {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

          <form onSubmit={handleSubmit}>
            <div className="row g-4">
              
              {/* --- LOGO SECTION --- */}
              <div className="col-md-4 text-center">
                <div className="mb-3">
                  <label className="form-label fw-bold">Business Logo</label>
                  <div className="border rounded p-3 bg-light d-flex justify-content-center align-items-center" style={{height: '200px'}}>
                    {previewUrl ? (
                      <img src={previewUrl} alt="Logo Preview" style={{maxHeight: '100%', maxWidth: '100%', objectFit: 'contain'}} />
                    ) : (
                      <span className="text-muted">No Logo Selected</span>
                    )}
                  </div>
                </div>
                <input type="file" className="form-control" accept="image/*" onChange={handleFileChange} />
                <small className="text-muted d-block mt-2">Recommended: Square PNG with transparent background.</small>
              </div>

              {/* --- FORM DETAILS --- */}
              <div className="col-md-8">
                <div className="mb-3">
                  <label className="form-label fw-bold">Business Name</label>
                  <input type="text" name="business_name" className="form-control" value={formData.business_name} onChange={handleChange} required />
                </div>

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

                <div className="mb-3">
                  <label className="form-label fw-bold">Address</label>
                  <textarea name="address" className="form-control" rows="3" value={formData.address} onChange={handleChange}></textarea>
                </div>

                {/* --- NAVBAR DISPLAY MODE (Updated Layout) --- */}
                <div className="mb-4">
                  <label className="form-label fw-bold d-block">Navbar Display Style</label>
                  {/* Changed flex-column to flex-wrap for horizontal layout */}
                  <div className="d-flex flex-wrap gap-4 border p-3 rounded bg-light">
                    
                    <div className="form-check">
                      <input 
                        className="form-check-input" 
                        type="radio" 
                        name="navbar_display_mode" 
                        id="navModeBoth" 
                        value="both" 
                        checked={formData.navbar_display_mode === 'both'} 
                        onChange={handleChange} 
                      />
                      <label className="form-check-label fw-500" htmlFor="navModeBoth">
                        Show Logo & Name
                      </label>
                    </div>

                    <div className="form-check">
                      <input 
                        className="form-check-input" 
                        type="radio" 
                        name="navbar_display_mode" 
                        id="navModeLogo" 
                        value="logo_only" 
                        checked={formData.navbar_display_mode === 'logo_only'} 
                        onChange={handleChange} 
                      />
                      <label className="form-check-label fw-500" htmlFor="navModeLogo">
                        Show Logo Only
                      </label>
                    </div>

                    <div className="form-check">
                      <input 
                        className="form-check-input" 
                        type="radio" 
                        name="navbar_display_mode" 
                        id="navModeName" 
                        value="name_only" 
                        checked={formData.navbar_display_mode === 'name_only'} 
                        onChange={handleChange} 
                      />
                      <label className="form-check-label fw-500" htmlFor="navModeName">
                        Show Name Only
                      </label>
                    </div>

                  </div>
                </div>

                <div className="d-grid">
                  <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Settings'}
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