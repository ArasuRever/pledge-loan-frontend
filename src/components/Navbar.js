import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function Navbar() {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    try {
      const response = await axios.get(`http://localhost:3001/api/loans/find-by-book-number/${searchTerm}`);
      navigate(`/loans/${response.data.loanId}`);
      setSearchTerm('');
    } catch (error) {
      alert('Loan not found.');
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">PledgeManager</Link>
        <ul className="navbar-nav me-auto mb-2 mb-lg-0">
          <li className="nav-item">
            <Link className="nav-link" to="/customers">Customers</Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" to="/loans">Loans</Link>
          </li>
        </ul>
        <form className="d-flex" onSubmit={handleSearch}>
          <input 
            className="form-control me-2" 
            type="search" 
            placeholder="Search by Book Loan #" 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <button className="btn btn-outline-success" type="submit">Search</button>
        </form>
      </div>
    </nav>
  );
}

export default Navbar;