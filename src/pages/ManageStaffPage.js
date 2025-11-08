// src/pages/ManageStaffPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Get the API URL from the .env file
const API_URL = process.env.REACT_APP_API_URL;

function ManageStaffPage({ userRole }) {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for the new staff form
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Fetch all users on component mount
  useEffect(() => {
    if (userRole === 'admin') {
      fetchUsers();
    }
  }, [userRole]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/users`);
      setUsers(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError('Failed to fetch user list.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Event Handlers ---

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    if (!newUsername || !newPassword) {
      alert('Please enter a username and password.');
      return;
    }
    try {
      await axios.post(`${API_URL}/api/users/staff`, {
        username: newUsername,
        password: newPassword,
      });
      alert('Staff user created successfully!');
      setNewUsername('');
      setNewPassword('');
      fetchUsers(); // Refresh the user list
    } catch (err) {
      console.error("Error creating staff:", err);
      alert(err.response?.data || 'Failed to create staff user.');
    }
  };

  const handleChangePassword = async (userId, username) => {
    const newPassword = prompt(`Enter new password for ${username}:`);
    if (!newPassword) return; // User cancelled

    try {
      await axios.put(`${API_URL}/api/users/change-password`, {
        userId: userId,
        newPassword: newPassword,
      });
      alert(`Password for ${username} updated successfully!`);
    } catch (err) {
      console.error("Error changing password:", err);
      alert(err.response?.data || 'Failed to change password.');
    }
  };

  const handleDeleteStaff = async (userId, username) => {
    if (window.confirm(`Are you sure you want to delete staff member ${username}? This cannot be undone.`)) {
      try {
        await axios.delete(`${API_URL}/api/users/${userId}`);
        alert(`Staff user ${username} deleted.`);
        fetchUsers(); // Refresh the user list
      } catch (err) {
        console.error("Error deleting staff:", err);
        alert(err.response?.data || 'Failed to delete staff user.');
      }
    }
  };

  // --- Render Logic ---

  // Show access denied message if a non-admin tries to view this page
  // This logic is based on your existing components
  if (userRole !== 'admin') {
    return (
      <div className="alert alert-danger" role="alert">
        <h4>Access Denied</h4>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="mb-4">Manage Staff & Users</h1>
      {error && <div className="alert alert-danger">{error}</div>}

      {/* 1. Create New Staff Form */}
      <div className="card mb-4">
        <div className="card-header">
          <h5>Create New Staff User</h5>
        </div>
        <div className="card-body">
          <form onSubmit={handleCreateStaff}>
            <div className="row">
              <div className="col-md-5 mb-3">
                <label htmlFor="newUsername" className="form-label">Username</label>
                <input
                  type="text"
                  className="form-control"
                  id="newUsername"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="New staff username"
                />
              </div>
              <div className="col-md-5 mb-3">
                <label htmlFor="newPassword" className="form-label">Password</label>
                <input
                  type="password"
                  className="form-control"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Temporary password"
                />
              </div>
              <div className="col-md-2 d-flex align-items-end mb-3">
                <button type="submit" className="btn btn-primary w-100">Create</button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* 2. User List */}
      <div className="card">
        <div className="card-header">
          <h5>Existing Users</h5>
        </div>
        <ul className="list-group list-group-flush">
          {users.map((user) => (
            <li key={user.id} className="list-group-item d-flex justify-content-between align-items-center">
              <div>
                <strong>{user.username}</strong>
                <br />
                <small className="text-muted">Role: {user.role}</small>
              </div>
              <div>
                <button
                  className="btn btn-outline-secondary btn-sm me-2"
                  onClick={() => handleChangePassword(user.id, user.username)}
                >
                  Change Password
                </button>
                {user.role === 'staff' && (
                  <button
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => handleDeleteStaff(user.id, user.username)}
                  >
                    Delete
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default ManageStaffPage;