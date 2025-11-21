import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SettingsPage = () => {
  const API_URL = process.env.REACT_APP_API_URL;
  
  const [formData, setFormData] = useState({
    business_name: '',
    address: '',
    phone_number: '',
    license_number: '',
    existingLogoUrl: ''
  });
  const [logoFile, setLogoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
    // eslint-disable-next-line
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/settings`);
      if (res.data) {
        setFormData({
          business_name: res.data.business_name || '',
          address: res.data.address || '',
          phone_number: res.data.phone_number || '',
          license_number: res.data.license_number || '',
          existingLogoUrl: res.data.logo_url || ''
        });
        if (res.data.logo_url) setPreviewUrl(res.data.logo_url);
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const data = new FormData();
    data.append('business_name', formData.business_name);
    data.append('address', formData.address);
    data.append('phone_number', formData.phone_number);
    data.append('license_number', formData.license_number);
    data.append('existingLogoUrl', formData.existingLogoUrl); // Send old URL just in case

    if (logoFile) {
      data.append('logo', logoFile);
    }

    try {
      await axios.put(`${API_URL}/api/settings`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert("Business settings updated successfully!");
      // Optional: Force reload to update Navbar logo immediately
      window.location.reload();
    } catch (err) {
      alert("Failed to save settings.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center mt-5">Loading...</div>;

  return (
    <div className="container mt-4" style={{maxWidth: '800px'}}>
      <h3 className="mb-4 text-primary fw-bold"><i className="bi bi-gear-fill me-2"></i>Business Settings</h3>
      
      <div className="card shadow-sm">
        <div className="card-header bg-white py-3">
           <h5 className="mb-0">Company Details</h5>
        </div>
        <div className="card-body p-4">
           <form onSubmit={handleSubmit}>
              {/* Logo Section */}
              <div className="mb-4 text-center">
                  <div className="mb-2">
                    {previewUrl ? (
                        <img src={previewUrl} alt="Logo" className="img-thumbnail" style={{maxHeight: '100px'}} />
                    ) : (
                        <div className="text-muted p-4 border rounded bg-light d-inline-block">No Logo Uploaded</div>
                    )}
                  </div>
                  <label className="btn btn-outline-primary btn-sm">
                    <i className="bi bi-upload me-2"></i> Upload Logo
                    <input type="file" hidden accept="image/*" onChange={handleFileChange} />
                  </label>
              </div>

              <div className="row g-3">
                  <div className="col-md-6">
                      <label className="form-label fw-bold">Business Name</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={formData.business_name} 
                        onChange={e => setFormData({...formData, business_name: e.target.value})} 
                        required
                      />
                  </div>
                  <div className="col-md-6">
                      <label className="form-label fw-bold">License Number</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={formData.license_number} 
                        onChange={e => setFormData({...formData, license_number: e.target.value})} 
                        placeholder="e.g. TN/SAL/12345"
                      />
                  </div>
                  <div className="col-md-6">
                      <label className="form-label fw-bold">Phone Number</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={formData.phone_number} 
                        onChange={e => setFormData({...formData, phone_number: e.target.value})} 
                      />
                  </div>
                  <div className="col-12">
                      <label className="form-label fw-bold">Full Address</label>
                      <textarea 
                        className="form-control" 
                        rows="3"
                        value={formData.address} 
                        onChange={e => setFormData({...formData, address: e.target.value})} 
                      ></textarea>
                  </div>
              </div>

              <div className="d-grid mt-4">
                 <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
                    {saving ? 'Saving...' : 'Save & Update Dashboard'}
                 </button>
              </div>
           </form>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;