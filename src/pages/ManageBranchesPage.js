// src/pages/ManageBranchesPage.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL;

const ManageBranchesPage = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/branches`);
      setBranches(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching branches", err);
      setLoading(false);
    }
  };

  const handleToggleStatus = async (branch) => {
    // 1. Determine current status (handle 1, "1", true)
    const isCurrentlyActive = branch.is_active === 1 || branch.is_active === true || branch.is_active === '1';
    
    // 2. Calculate new status (Force to 1 or 0 for DB compatibility)
    const newStatusInt = isCurrentlyActive ? 0 : 1; 

    try {
      // Optimistic UI update
      setBranches(branches.map(b => b.id === branch.id ? { ...b, is_active: newStatusInt } : b));
      
      // Send 1 or 0 to backend
      await axios.put(`${API_URL}/api/branches/${branch.id}`, {
        ...branch,
        is_active: newStatusInt
      });
    } catch (err) {
      console.error("Status update failed", err);
      alert("Failed to update status");
      fetchBranches(); // Revert on error
    }
  };

  const handleDeleteBranch = async (id) => {
    if (!window.confirm("Are you sure you want to delete this branch? WARNING: This may delete all associated data (loans, customers, etc.).")) return;
    
    try {
      await axios.delete(`${API_URL}/api/branches/${id}`);
      setBranches(branches.filter(b => b.id !== id));
    } catch (err) {
      alert("Failed to delete branch. Ensure it has no active dependencies or try again.");
    }
  };

  if (loading) return <div className="text-center mt-5"><div className="spinner-border text-primary"></div></div>;

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-0 fw-bold">Manage Branches</h2>
          <p className="text-muted small">Configure physical branch locations and access.</p>
        </div>
        <Link to="/branches/new" className="btn btn-primary fw-bold shadow-sm">
          <i className="bi bi-plus-lg me-2"></i>Add Branch
        </Link>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="ps-4">Branch Info</th>
                  <th>Code</th>
                  <th>Status (Toggle)</th>
                  <th className="text-end pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {branches.map((branch) => {
                  // Check status for UI
                  const isActive = branch.is_active === 1 || branch.is_active === true || branch.is_active === '1';

                  return (
                    <tr key={branch.id}>
                      <td className="ps-4">
                        <Link to={`/branches/${branch.id}`} className="text-decoration-none text-dark">
                          <div className="fw-bold fs-5">{branch.branch_name}</div>
                          <div className="text-muted small">ID: {branch.id}</div>
                        </Link>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">{branch.branch_code}</span>
                      </td>
                      <td>
                        <div className="form-check form-switch">
                          <input 
                            className="form-check-input" 
                            type="checkbox" 
                            checked={isActive}
                            onChange={() => handleToggleStatus(branch)}
                            style={{ cursor: 'pointer' }}
                          />
                          <label className={`form-check-label small fw-bold ${isActive ? 'text-success' : 'text-muted'}`}>
                            {isActive ? 'Active' : 'Inactive'}
                          </label>
                        </div>
                      </td>
                      <td className="text-end pe-4">
                        <Link to={`/branches/${branch.id}`} className="btn btn-sm btn-outline-primary me-2 fw-bold">
                          <i className="bi bi-pencil-square me-1"></i> Manage
                        </Link>
                        <button 
                          className="btn btn-sm btn-outline-danger fw-bold" 
                          onClick={() => handleDeleteBranch(branch.id)}
                        >
                          <i className="bi bi-trash me-1"></i> Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageBranchesPage;