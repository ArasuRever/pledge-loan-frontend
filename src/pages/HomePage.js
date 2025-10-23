import React from 'react';
import { Link } from 'react-router-dom';

function HomePage() {
  return (
    <div className="p-5 mb-4 bg-light rounded-3">
      <div className="container-fluid py-5">
        <h1 className="display-5 fw-bold">Welcome to PledgeManager</h1>
        <p className="col-md-8 fs-4">Your central hub for managing pledge loans.</p>
        <p>Use the navigation bar to get started.</p>
        <Link className="btn btn-primary btn-lg" to="/customers">Manage Customers</Link>
      </div>
    </div>
  );
}

export default HomePage;