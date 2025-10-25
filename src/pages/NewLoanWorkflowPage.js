import React, { useState, useEffect } from 'react';
// Removed 'Link' from this import
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import LoanForm from '../components/LoanForm';

function NewLoanWorkflowPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [customerResults, setCustomerResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [message, setMessage] = useState('Search for a customer by name or phone number.');
  const navigate = useNavigate();

  useEffect(() => {
      setSelectedCustomer(null);
      setCustomerResults([]);
      setMessage('Search for a customer by name or phone number.');
  }, []);
  
  useEffect(() => {
    const liveSearch = async () => {
      if (searchTerm.trim().length > 0) {
        setCustomerResults([]);
        setSelectedCustomer(null);

        try {
          const response = await axios.get('http://localhost:3001/api/customers');
          
          const results = response.data.filter(c => 
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.phone_number && c.phone_number.includes(searchTerm))
          );

          if (results.length > 0) {
            setCustomerResults(results);
            setMessage(`Found ${results.length} matching customers.`);
          } else {
            setMessage(`Customer '${searchTerm}' not found.`);
            setCustomerResults([]);
          }
        } catch (error) {
          setMessage('An error occurred during search.');
          console.error("Live Search Error:", error);
        }
      } else {
        setCustomerResults([]);
        setSelectedCustomer(null);
        setMessage('Search for a customer by name or phone number.');
      }
    };

    liveSearch();
  }, [searchTerm]); 

  const handleCreateCustomer = () => {
      navigate('/customers'); 
  };

  const onLoanAddedRefresh = () => {
      setSelectedCustomer(null);
      setSearchTerm('');
      setCustomerResults([]);
      setMessage('Loan added successfully. Start a new search.');
  }
  
  // Removed the unused handleFormSubmit function

  return (
    <div className="row">
      <div className="col-lg-8 offset-lg-2">
        <h2>New Loan Workflow</h2>
        <div className="card p-3 mb-4">
          <div className="input-group"> 
            <input
              type="text"
              className="form-control"
              placeholder="Start typing customer name or phone number..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="alert alert-info">
            {message}
            {message.includes('not found') && (
                <button onClick={handleCreateCustomer} className="btn btn-success btn-sm ms-3">
                    + Create New Customer
                </button>
            )}
        </div>

        {customerResults.length > 0 && !selectedCustomer && (
            <div className="list-group mb-4">
                <h6>Suggestions:</h6>
                {customerResults.map(c => (
                    <button 
                        key={c.id} 
                        type="button" 
                        className="list-group-item list-group-item-action"
                        onClick={() => { 
                          setSelectedCustomer(c); 
                          setCustomerResults([]); 
                          setMessage(`Selected: ${c.name}`);
                        }}
                    >
                        {c.name} ({c.phone_number})
                    </button>
                ))}
            </div>
        )}
        
        {selectedCustomer && (
            <div className="card border-success">
                <div className="card-header bg-success text-white">
                    Creating Loan for: {selectedCustomer.name}
                </div>
                <LoanForm 
                    customerId={selectedCustomer.id} 
                    onLoanAdded={onLoanAddedRefresh} 
                />
            </div>
        )}
      </div>
    </div>
  );
}

export default NewLoanWorkflowPage;