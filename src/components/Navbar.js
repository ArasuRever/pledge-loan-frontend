// src/components/Navbar.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // Corrected import

const Navbar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  let userRole = null;
  let username = null;

  if (token) {
    try {
      const decodedToken = jwtDecode(token);
      userRole = decodedToken.role;
      username = decodedToken.username;
    } catch (error) {
      console.error("Invalid token:", error);
      localStorage.removeItem('token');
      // No navigation here, just log out state
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">Pledge Loan Mgmt</Link>
        
        <div className="flex items-center space-x-4">
          {token ? (
            <>
              {/* --- Admin Only Links --- */}
              {userRole === 'admin' && (
                <>
                  <Link to="/" className="hover:text-gray-300">Dashboard</Link>
                  <Link to="/staff" className="hover:text-gray-300">Manage Staff</Link>
                  
                  {/* --- ⭐ NEW RECYCLE BIN DROPDOWN --- */}
                  <div className="relative group">
                    <button className="hover:text-gray-300 focus:outline-none">
                      Recycle Bin
                    </button>
                    <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-md shadow-lg py-1 z-20 hidden group-hover:block">
                      <Link 
                        to="/deleted-customers" 
                        className="block px-4 py-2 text-sm text-white hover:bg-gray-600"
                      >
                        Deleted Customers
                      </Link>
                      <Link 
                        to="/deleted-loans" 
                        className="block px-4 py-2 text-sm text-white hover:bg-gray-600"
                      >
                        Deleted Loans
                      </Link>
                    </div>
                  </div>
                  {/* --- END NEW DROPDOWN --- */}

                </>
              )}

              {/* --- Common Links for Admin & Staff --- */}
              <Link to="/customers" className="hover:text-gray-300">Customers</Link>
              <Link to="/loans" className="hover:text-gray-300">All Loans</Link>
              <Link to="/new-loan" className="hover:text-gray-300">New Loan</Link>
              
              <span className="text-gray-400">|</span>
              <span className="font-medium">{username} ({userRole})</span>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="hover:text-gray-300">Login</Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;