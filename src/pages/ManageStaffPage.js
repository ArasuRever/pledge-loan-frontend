// src/pages/ManageStaffPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ManageStaffPage = () => {
  const API_URL = process.env.REACT_APP_API_URL;
  
  // --- State ---
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]); // <--- NEW: Store branches
  const [loading, setLoading] = useState(true);
  
  // Create Form State
  const [newUser, setNewUser] = useState({ 
    username: '', 
    password: '', 
    role: 'staff',
    branchId: '' // <--- NEW: Track selected branch
  });
  const [isCreating, setIsCreating] = useState(false);

  // Change Password Modal State
  const [passwordData, setPasswordData] = useState({ userId: null, username: '', newPassword: '' });
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // --- Load Data (Users + Branches) ---
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [API_URL]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch both Users and Branches in parallel
      const [usersRes, branchesRes] = await Promise.all([
        axios.get(`${API_URL}/api/users`),
        axios.get(`${API_URL}/api/branches`)
      ]);

      setUsers(usersRes.data);
      setBranches(branchesRes.data);

      // Default the new user form to the first available branch
      if (branchesRes.data.length > 0) {
        setNewUser(prev => ({ ...prev, branchId: branchesRes.data[0].id }));
      }

    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers ---

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password) return alert("Username and Password required");
    if (!newUser.branchId) return alert("Please select a branch"); // <--- Validation

    try {
      await axios.post(`${API_URL}/api/users/create`, newUser);
      alert(`New ${newUser.role.toUpperCase()} created successfully!`);
      
      // Reset form
      setNewUser({ 
        username: '', 
        password: '', 
        role: 'staff', 
        branchId: branches[0]?.id || '' 
      });
      setIsCreating(false);
      fetchData(); // Refresh list
    } catch (err) {
      alert(err.response?.data || "Failed to create user.");
    }
  };

  const handleDeleteUser = async (id, username) => {
    if (!window.confirm(`Are you sure you want to delete user '${username}'? This cannot be undone.`)) return;
    
    try {
      await axios.delete(`${API_URL}/api/users/${id}`);
      alert("User deleted successfully.");
      fetchData(); // Refresh list
    } catch (err) {
      alert(err.response?.data || "Failed to delete user.");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/api/users/change-password`, {
        userId: passwordData.userId,
        newPassword: passwordData.newPassword
      });
      alert("Password updated successfully.");
      setShowPasswordModal(false);
      setPasswordData({ userId: null, username: '', newPassword: '' });
    } catch (err) {
      alert(err.response?.data || "Failed to update password.");
    }
  };

  // Helper to find branch name by ID
  const getBranchName = (id) => {
    const branch = branches.find(b => b.id === id);
    return branch ? branch.branch_name : 'Main Branch';
  };

  return (
    // --- CONTAINER ---
    <div className="container mt-4 pb-5" style={{ maxWidth: '1000px' }}> 
      
      {/* --- HEADER --- */}
      <div className="d-flex justify-content-between align-items-center mb-4 p-3 bg-white rounded shadow-sm border">
        <div className="d-flex align-items-center">
            <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '45px', height: '45px'}}>
                <i className="bi bi-shield-lock-fill fs-5"></i>
            </div>
            <h4 className="text-dark fw-bold mb-0">Manage Access</h4>
        </div>
        <button 
          className={`btn ${isCreating ? 'btn-outline-secondary' : 'btn-primary'} fw-bold px-4`}
          onClick={() => setIsCreating(!isCreating)}
        >
          <i className={`bi ${isCreating ? 'bi-x-lg' : 'bi-person-plus-fill'} me-2`}></i>
          {isCreating ? 'Close Form' : 'Add User'}
        </button>
      </div>

      {/* --- CREATE USER CARD --- */}
      {isCreating && (
        <div className="card shadow-sm mb-4 border-0 border-top border-4 border-success animate__animated animate__fadeIn">
          <div className="card-body p-4 bg-light">
            <h6 className="text-uppercase text-success fw-bold mb-3">Create New Account</h6>
            <form onSubmit={handleCreateUser} className="row g-3">
              <div className="col-md-3">
                <label className="form-label small fw-bold text-muted">USERNAME</label>
                <div className="input-group bg-white">
                    <span className="input-group-text border-0 bg-transparent"><i className="bi bi-person"></i></span>
                    <input 
                    type="text" 
                    className="form-control border-0 ps-0" 
                    placeholder="e.g. rajesh_manager"
                    value={newUser.username} 
                    onChange={(e) => setNewUser({...newUser, username: e.target.value})} 
                    required
                    autoComplete="off"
                    />
                </div>
              </div>
              <div className="col-md-3">
                <label className="form-label small fw-bold text-muted">PASSWORD</label>
                <div className="input-group bg-white">
                    <span className="input-group-text border-0 bg-transparent"><i className="bi bi-key"></i></span>
                    <input 
                    type="text" 
                    className="form-control border-0 ps-0" 
                    placeholder="Set password"
                    value={newUser.password} 
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})} 
                    required
                    autoComplete="new-password"
                    />
                </div>
              </div>
              
              {/* --- BRANCH SELECTOR (NEW) --- */}
              <div className="col-md-3">
                <label className="form-label small fw-bold text-muted">ASSIGN BRANCH</label>
                <select 
                  className="form-select border-0 shadow-sm" 
                  value={newUser.branchId} 
                  onChange={(e) => setNewUser({...newUser, branchId: e.target.value})}
                  required
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.branch_name} ({b.branch_code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-2">
                <label className="form-label small fw-bold text-muted">ROLE</label>
                <select 
                  className="form-select border-0 shadow-sm" 
                  value={newUser.role} 
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                >
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="col-md-1 d-grid">
                <label className="form-label d-none d-md-block">&nbsp;</label>
                <button type="submit" className="btn btn-success fw-bold shadow-sm"><i className="bi bi-check-lg"></i></button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- USERS LIST CARD --- */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white py-3 border-bottom">
            <h6 className="mb-0 fw-bold text-secondary text-uppercase">System Users ({users.length})</h6>
        </div>
        <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light small text-muted text-uppercase">
                <tr>
                  <th className="ps-4">User Profile</th>
                  <th>Branch</th> {/* NEW COLUMN */}
                  <th>Access Level</th>
                  <th className="text-end pe-4">Account Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="4" className="text-center py-5 text-muted">Loading users...</td></tr>
                ) : users.map(user => {
                  const role = user.role || 'staff'; 
                  const isAdmin = role === 'admin';
                  
                  return (
                    <tr key={user.id}>
                      <td className="ps-4 py-3">
                        <div className="d-flex align-items-center">
                            <div className={`rounded-circle ${isAdmin ? 'bg-danger' : 'bg-info'} text-white d-flex align-items-center justify-content-center me-3 shadow-sm`} style={{width: '40px', height: '40px', fontSize: '1.1rem'}}>
                                {user.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div className="fw-bold text-dark">{user.username}</div>
                                <div className="small text-muted">ID: #{user.id}</div>
                            </div>
                        </div>
                      </td>
                      
                      {/* --- BRANCH COLUMN (NEW) --- */}
                      <td>
                        <div className="d-flex align-items-center text-secondary">
                            <i className="bi bi-geo-alt me-2"></i>
                            {/* If admin, they see all, but usually belong to Main. If staff, show their specific branch. */}
                            {getBranchName(user.branch_id)}
                        </div>
                      </td>

                      <td>
                        <span className={`badge rounded-pill px-3 py-2 ${isAdmin ? 'bg-danger bg-opacity-10 text-danger border border-danger' : 'bg-info bg-opacity-10 text-info border border-info'}`}>
                          {role.toUpperCase()}
                        </span>
                      </td>
                      <td className="text-end pe-4">
                        <div className="d-flex justify-content-end gap-2">
                            <button 
                                className="btn btn-outline-primary btn-sm d-flex align-items-center px-3"
                                title="Reset Password"
                                onClick={() => {
                                    setPasswordData({ userId: user.id, username: user.username, newPassword: '' });
                                    setShowPasswordModal(true);
                                }}
                            >
                                <i className="bi bi-key-fill me-2"></i> Password
                            </button>
                            
                            <button 
                                className="btn btn-outline-danger btn-sm d-flex align-items-center px-3"
                                title="Delete User"
                                onClick={() => handleDeleteUser(user.id, user.username)}
                            >
                                <i className="bi bi-trash-fill me-2"></i> Delete
                            </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
        </div>
      </div>

      {/* --- CHANGE PASSWORD MODAL (No changes here) --- */}
      {showPasswordModal && (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050, display: 'flex', 
            justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(3px)'
        }}>
          <div className="bg-white rounded-3 shadow-lg w-100 mx-3 animate__animated animate__zoomIn" style={{maxWidth: '400px'}}>
             <div className="bg-light border-bottom p-3 d-flex justify-content-between align-items-center">
                <h6 className="mb-0 text-dark fw-bold"><i className="bi bi-shield-lock me-2"></i>Reset Password</h6>
                <button type="button" className="btn-close btn-sm" onClick={() => setShowPasswordModal(false)}></button>
             </div>
             
             <div className="p-4">
                <div className="text-center mb-4">
                    <div className="avatar bg-warning text-dark rounded-circle d-inline-flex align-items-center justify-content-center mb-2" style={{width: '50px', height: '50px'}}>
                        <i className="bi bi-key-fill fs-4"></i>
                    </div>
                    <p className="mb-0 fw-bold fs-5">{passwordData.username}</p>
                    <small className="text-muted">Enter a new password below</small>
                </div>

                <form onSubmit={handleChangePassword}>
                    <div className="mb-3">
                        <input 
                            type="text" 
                            className="form-control form-control-lg text-center bg-light"
                            placeholder="New Password"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                            required
                            autoFocus
                        />
                    </div>
                    <div className="d-grid gap-2">
                        <button type="submit" className="btn btn-dark fw-bold py-2">Update Password</button>
                    </div>
                </form>
             </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManageStaffPage;