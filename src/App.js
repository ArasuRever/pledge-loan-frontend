import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CustomersPage from './pages/CustomersPage';
import CustomerPage from './pages/CustomerPage';
import LoanPage from './pages/LoanPage';
import { OverdueLoansPage } from './pages/OverdueLoansPage';
import AllLoansPage from './pages/AllLoansPage';
import Navbar from './components/Navbar';
import NewLoanWorkflowPage from './pages/NewLoanWorkflowPage';

function App() {
  return (
    <Router>
      <Navbar />
      <div className="container mt-4">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/loans" element={<AllLoansPage />} />
          <Route path="/overdue" element={<OverdueLoansPage />} />
          <Route path="/customers/:id" element={<CustomerPage />} />
          <Route path="/loans/:id" element={<LoanPage />} />
          <Route path="/new-loan" element={<NewLoanWorkflowPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;