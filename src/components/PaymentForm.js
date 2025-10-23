import React, { useState } from 'react';
import axios from 'axios';

function PaymentForm({ loanId, onPaymentAdded }) {
  const [amount, setAmount] = useState('');
  const [paymentType, setPaymentType] = useState('interest');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || amount <= 0) return alert('Please enter a valid amount.');
    try {
      await axios.post('http://localhost:3001/api/transactions', { loan_id: loanId, amount_paid: amount, payment_type: paymentType });
      alert('Payment added!');
      setAmount('');
      onPaymentAdded();
    } catch (error) {
      alert('Failed to add payment.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h4>Make a Payment</h4>
      <div className="d-flex">
        <input type="number" step="0.01" id="paymentAmount" className="form-control me-2" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount (₹)" required />
        <select id="paymentType" className="form-select me-2" value={paymentType} onChange={e => setPaymentType(e.target.value)}>
          <option value="interest">Interest</option>
          <option value="principal">Principal</option>
        </select>
        <button type="submit" className="btn btn-primary">Add</button>
      </div>
    </form>
  );
}

export default PaymentForm;