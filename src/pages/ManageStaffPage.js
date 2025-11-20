// src/pages/ManageStaffPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ManageStaffPage = () => {
  const API_URL = process.env.REACT_APP_API_URL;
  
  // State for List
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State for Create Form
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'staff' });
  const [isCreating, setIsCreating] = useState(false);

  // State for Change Password Modal
  const [passwordData, setPasswordData] = useState({ userId: null, username: '', newPassword: '' });
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/users`);
      setUsers(res.data);
    } catch (err) {
      console.error("Fetch users error:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLERS ---

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password) return alert("Username and Password required");
    
    try {
      await axios.post(`${API_URL}/api/users/create`, newUser);
      alert(`New ${newUser.role} created successfully!`);
      setNewUser({ username: '', password: '', role: 'staff' });
      setIsCreating(false);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data || "Failed to create user");
    }
  };

  const handleDeleteUser = async (id, username) => {
    if (!window.confirm(`Are you sure you want to delete user '${username}'? This cannot be undone.`)) return;
    
    try {
      await axios.delete(`${API_URL}/api/users/${id}`);
      alert("User deleted.");
      fetchUsers();
    } catch (err) {
      alert(err.response?.data || "Failed to delete user");
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
      alert(err.response?.data || "Failed to update password");
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-primary fw-bold"><i className="bi bi-people-fill me-2"></i>Manage Access</h2>
        <button 
          className={`btn ${isCreating ? 'btn-secondary' : 'btn-success'}`}
          onClick={() => setIsCreating(!isCreating)}
        >
          <i className={`bi ${isCreating ? 'bi-x-lg' : 'bi-person-plus-fill'} me-2`}></i>
          {isCreating ? 'Cancel' : 'Create New User'}
        </button>
      </div>

      {/* --- CREATE USER FORM --- */}
      {isCreating && (
        <div className="card shadow-sm mb-4 border-success">
          <div className="card-header bg-success text-white fw-bold">
             Add New Admin or Staff
          </div>
          <div className="card-body">
            <form onSubmit={handleCreateUser} className="row g-3 align-items-end">
              <div className="col-md-4">
                <label className="form-label fw-medium">Username</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={newUser.username} 
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})} 
                  required
                  autoComplete="off"
                />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-medium">Password</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={newUser.password} 
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})} 
                  required
                  autoComplete="new-password"
                />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-medium">Role</label>
                <select 
                  className="form-select" 
                  value={newUser.role} 
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                >
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="col-md-2 d-grid">
                <button type="submit" className="btn btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- USERS LIST --- */}
      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="4" className="text-center py-4">Loading...</td></tr>
                ) : users.map(user => (
                  <tr key={user.id}>
                    <td className="text-muted small">#{user.id}</td>
                    <td className="fw-bold">{user.username}</td>
                    <td>
                      <span className={`badge rounded-pill bg-${user.role === 'admin' ? 'danger' : 'info text-dark'}`}>
                        {user.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="text-end">
                      <button 
                        className="btn btn-sm btn-outline-warning me-2"
                        onClick={() => {
                            setPasswordData({ userId: user.id, username: user.username, newPassword: '' });
                            setShowPasswordModal(true);
                        }}
                      >
                        <i className="bi bi-key-fill me-1"></i> Pwd
                      </button>
                      <button 
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDeleteUser(user.id, user.username)}
                      >
                        <i className="bi bi-trash-fill"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- CHANGE PASSWORD MODAL --- */}
      {showPasswordModal && (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
            backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050, display: 'flex', 
            justifyContent: 'center', alignItems: 'center'
        }}>
          <div className="bg-white p-4 rounded shadow w-100" style={{maxWidth: '400px'}}>
             <h5 className="mb-3">Change Password for <strong>{passwordData.username}</strong></h5>
             <form onSubmit={handleChangePassword}>
                <div className="mb-3">
                    <label className="form-label">New Password</label>
                    <input 
                        type="text" 
                        className="form-control"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                        required
                    />
                </div>
                <div className="d-flex justify-content-end gap-2">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowPasswordModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary">Update</button>
                </div>
             </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManageStaffPage;