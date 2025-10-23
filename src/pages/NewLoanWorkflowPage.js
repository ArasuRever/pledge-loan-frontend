import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import LoanForm from '../components/LoanForm';

function NewLoanWorkflowPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [customerResults, setCustomerResults] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [message, setMessage] = useState('Search for a customer by name or phone number.');
    const navigate = useNavigate();

    // Reset on component mount
    useEffect(() => {
        setSelectedCustomer(null);
        setCustomerResults([]);
        setMessage('Search for a customer by name or phone number.');
    }, []);
    
    // --- NEW: Live Search Logic ---
    useEffect(() => {
        const liveSearch = async () => {
            // Only search if input is not empty
            if (searchTerm.trim().length > 0) {
                setCustomerResults([]);
                setSelectedCustomer(null);

                try {
                    // Fetch ALL customers (this works because we have few customers. For thousands, we'd add search logic to the API)
                    const response = await axios.get('http://localhost:3001/api/customers');
                    
                    const results = response.data.filter(c => 
                      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      c.phone_number.includes(searchTerm)
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

        // Debounce the search (optional: remove or comment out the next two lines if you want it to search instantly)
        // const delayDebounceFn = setTimeout(() => {
            liveSearch();
        // }, 300); // Wait 300ms after last keypress to run search

        // return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]); // Run effect whenever searchTerm changes
    // --- END Live Search Logic ---

    // Redirect to the customer's detail page to create them if new
    const handleCreateCustomer = () => {
        navigate('/customers'); 
    };

    const onLoanAddedRefresh = () => {
        setSelectedCustomer(null);
        setSearchTerm('');
        setCustomerResults([]);
        setMessage('Loan added successfully. Start a new search.');
    }
    
    // Function to handle loan form submission (now only used to prevent default)
    const handleFormSubmit = (e) => e.preventDefault(); 


    // --- Render Logic ---
    return (
        <div className="row">
          <div className="col-lg-8 offset-lg-2">
            <h2>New Loan Workflow</h2>
            <div className="card p-3 mb-4">
              {/* REMOVED SEARCH BUTTON AND SUBMIT LOGIC. Search now happens on change */}
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

            {/* --- SEARCH RESULTS / MESSAGING --- */}
            <div className="alert alert-info">
                {message}
                {message.includes('not found') && (
                    <button onClick={handleCreateCustomer} className="btn btn-success btn-sm ms-3">
                        + Create New Customer
                    </button>
                )}
            </div>

            {/* --- LIST LIVE SUGGESTIONS / CUSTOMER SELECTION --- */}
            {customerResults.length > 0 && !selectedCustomer && (
                <div className="list-group mb-4">
                    <h6>Suggestions:</h6>
                    {customerResults.map(c => (
                        <button 
                            key={c.id} 
                            type="button" 
                            className="list-group-item list-group-item-action"
                            onClick={() => { setSelectedCustomer(c); setCustomerResults([]); }}
                        >
                            {c.name} ({c.phone_number})
                        </button>
                    ))}
                </div>
            )}
            
            {/* --- LOAN FORM (if a single customer is selected) --- */}
            {selectedCustomer && (
                <div className="card border-success">
                    <div className="card-header bg-success text-white">
                        Creating Loan for: {selectedCustomer.name}
                    </div>
                    {/* LoanForm now takes the customer ID */}
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