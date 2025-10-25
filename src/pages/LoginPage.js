import React, { useState } from 'react';
import axios from 'axios';

// We'll pass a function 'onLoginSuccess' from App.js to save the token
function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear any previous errors

    try {
      // Make API call to the login endpoint
      const response = await axios.post('http://localhost:3001/api/auth/login', {
        username: username,
        password: password
      });

      // On success, the backend sends back a token
      const token = response.data.token;

      // Call the function from App.js to handle the successful login
      onLoginSuccess(token);

    } catch (err) {
      console.error('Login failed:', err);
      setError('Invalid username or password. Please try again.');
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-6 col-lg-4">
        <div className="card shadow-sm">
          <div className="card-body">
            <h3 className="card-title text-center mb-4">Login</h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="username" className="form-label">Username</label>
                <input
                  type="text"
                  id="username"
                  className="form-control"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="password" className="form-label">Password</label>
                <input
                  type="password"
                  id="password"
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              <div className="d-grid">
                <button type="submit" className="btn btn-primary">Login</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;