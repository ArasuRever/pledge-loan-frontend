// src/pages/BranchDetailsPage.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL;

const BranchDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [branch, setBranch] = useState(null);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  // Password Reset Modal State
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [pwdData, setPwdData] = useState({ userId: null, username: '', newPassword: '' });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Fetch Branch Details
      const branchRes = await axios.get(`${API_URL}/api/branches/${id}`);
      
      // 2. Fetch All Users (to filter for this branch)
      const usersRes = await axios.get(`${API_URL}/api/users`, { headers });
      
      // Filter users belonging to this branch (handle string vs number comparison)
      // eslint-disable-next-line
      const branchStaff = usersRes.data.filter(u => u.branch_id == id);

      setBranch(branchRes.data);
      setStaff(branchStaff);
    } catch (err) {
      console.error(err);
      alert("Failed to load data.");
      navigate('/manage-branches');
    } finally {
      setLoading(false);
    }
  };

  // --- BRANCH FORM HANDLERS ---
  const handleBranchChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setBranch({ ...branch, [e.target.name]: value });
  };

  const handleBranchSubmit = async (e) => {
    e.preventDefault();
    try {
      // FORCE STATUS TO INTEGER (1 or 0)
      // This fixes the bug where status wasn't saving
      const payload = {
        ...branch,
        is_active: branch.is_active ? 1 : 0 
      };

      await axios.put(`${API_URL}/api/branches/${id}`, payload);
      alert("Branch details updated successfully!");
      fetchData(); // Refresh data from server to confirm save
    } catch (err) {
      console.error("Update error:", err);
      alert("Error updating branch");
    }
  };

  // --- STAFF HANDLERS ---
  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Remove this user from the system?")) return;
    try {
      await axios.delete(`${API_URL}/api/users/${userId}`);
      setStaff(staff.filter(u => u.id !== userId));
    } catch (err) {
      alert("Failed to delete user.");
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/api/users/change-password`, {
        userId: pwdData.userId,
        newPassword: pwdData.newPassword
      });
      alert("Password updated.");
      setShowPwdModal(false);
      setPwdData({ userId: null, username: '', newPassword: '' });
    } catch (err) {
      alert("Failed to update password.");
    }
  };

  if (loading || !branch) return <div className="text-center mt-5"><div className="spinner-border text-primary"></div></div>;

  // Helper for "Active" Checkbox logic
  const isBranchActive = branch.is_active === 1 || branch.is_active === true || branch.is_active === '1';

  return (
    <div className="container mt-4 mb-5">
      {/* HEADER */}
      <div className="d-flex align-items-center mb-4">
        {/* BACK BUTTON WITH TEXT */}
        <button className="btn btn-light border me-3 fw-bold" onClick={() => navigate('/manage-branches')}>
           <i className="bi bi-arrow-left me-2"></i>Back
        </button>
        <div>
           <h2 className="fw-bold mb-0">{branch.branch_name}</h2>
           <span className="text-muted small">Branch Code: {branch.branch_code}</span>
        </div>
        <div className="ms-auto">
             <span className={`badge px-3 py-2 ${isBranchActive ? 'bg-success' : 'bg-danger'}`}>
                {isBranchActive ? 'Active' : 'Inactive'}
             </span>
        </div>
      </div>

      <div className="row g-4">
        
        {/* --- 1. STAFF LIST --- */}
        <div className="col-lg-8">
            <div className="card shadow-sm border-0 h-100">
                <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                    <h5 className="mb-0 fw-bold text-primary"><i className="bi bi-people-fill me-2"></i>Staff & Managers</h5>
                    <button className="btn btn-sm btn-outline-primary fw-bold" onClick={() => navigate('/manage-staff')}>
                        <i className="bi bi-plus-lg me-1"></i> Add New Staff
                    </button>
                </div>
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                            <tr>
                                <th className="ps-3">User</th>
                                <th>Role</th>
                                <th className="text-end pe-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {staff.length === 0 ? (
                                <tr><td colSpan="3" className="text-center py-4 text-muted">No staff assigned to this branch.</td></tr>
                            ) : staff.map(u => (
                                <tr key={u.id}>
                                    <td className="ps-3">
                                        <div className="fw-bold">{u.username}</div>
                                    </td>
                                    <td>
                                        <span className={`badge rounded-pill ${
                                            u.role === 'manager' ? 'bg-warning text-dark' : 'bg-info text-dark'
                                        }`}>
                                            {u.role.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="text-end pe-3">
                                        {/* ACTION BUTTONS WITH TEXT */}
                                        <button 
                                            className="btn btn-sm btn-light border me-2 fw-bold text-dark"
                                            title="Reset Password"
                                            onClick={() => {
                                                setPwdData({ userId: u.id, username: u.username, newPassword: '' });
                                                setShowPwdModal(true);
                                            }}
                                        >
                                            <i className="bi bi-key me-1"></i> Reset Password
                                        </button>
                                        <button 
                                            className="btn btn-sm btn-light border text-danger fw-bold"
                                            title="Remove User"
                                            onClick={() => handleDeleteUser(u.id)}
                                        >
                                            <i className="bi bi-trash me-1"></i> Remove
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {/* --- 2. EDIT BRANCH DETAILS --- */}
        <div className="col-lg-4">
            <div className="card shadow-sm border-0">
                <div className="card-header bg-light py-3">
                    <h5 className="mb-0 fw-bold text-dark"><i className="bi bi-gear-fill me-2"></i>Settings</h5>
                </div>
                <div className="card-body">
                    <form onSubmit={handleBranchSubmit}>
                        <div className="mb-3">
                            <label className="form-label small fw-bold text-muted">BRANCH NAME</label>
                            <input 
                                type="text" 
                                name="branch_name" 
                                className="form-control" 
                                value={branch.branch_name} 
                                required 
                                onChange={handleBranchChange} 
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label small fw-bold text-muted">CODE</label>
                            <input 
                                type="text" 
                                name="branch_code" 
                                className="form-control text-uppercase" 
                                value={branch.branch_code} 
                                required 
                                onChange={handleBranchChange} 
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label small fw-bold text-muted">PHONE</label>
                            <input 
                                type="text" 
                                name="phone_number" 
                                className="form-control" 
                                value={branch.phone_number || ''} 
                                onChange={handleBranchChange} 
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label small fw-bold text-muted">ADDRESS</label>
                            <textarea 
                                name="address" 
                                className="form-control" 
                                rows="3" 
                                value={branch.address || ''} 
                                onChange={handleBranchChange}
                            ></textarea>
                        </div>
                        
                        <div className="form-check form-switch mb-4">
                            {/* Controlled Component using robust boolean check */}
                            <input 
                                className="form-check-input" 
                                type="checkbox" 
                                name="is_active" 
                                checked={isBranchActive} 
                                onChange={handleBranchChange} 
                                id="activeCheck" 
                            />
                            <label className="form-check-label" htmlFor="activeCheck">Operational Status (Active)</label>
                        </div>

                        <div className="d-grid">
                            <button type="submit" className="btn btn-primary fw-bold">Save Changes</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
      </div>

      {/* --- PASSWORD RESET MODAL --- */}
      {showPwdModal && (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055, display: 'flex', 
            justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(2px)'
        }}>
            <div className="bg-white rounded p-4 shadow-lg w-100" style={{maxWidth: '350px'}}>
                <h5 className="mb-3 fw-bold">Reset Password</h5>
                <p className="text-muted small">New password for <b>{pwdData.username}</b>:</p>
                <form onSubmit={handlePasswordReset}>
                    <input 
                        type="text" 
                        className="form-control mb-3" 
                        placeholder="Enter new password"
                        value={pwdData.newPassword}
                        onChange={(e) => setPwdData({...pwdData, newPassword: e.target.value})}
                        required
                        autoFocus
                    />
                    <div className="d-flex justify-content-end gap-2">
                        <button type="button" className="btn btn-light" onClick={() => setShowPwdModal(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary">Update</button>
                    </div>
                </form>
            </div>
        </div>
      )}

    </div>
  );
};

export default BranchDetailsPage;