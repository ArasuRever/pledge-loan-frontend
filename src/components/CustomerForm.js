import React, { useState } from 'react';
import axios from 'axios';

function CustomerForm({ onCustomerAdded }) {
    const [name, setName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [address, setAddress] = useState('');
    const [photo, setPhoto] = useState(null); // State for the file

    const handleFileChange = (e) => {
        setPhoto(e.target.files[0]); // Store the selected file object
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('name', name);
        formData.append('phone_number', phoneNumber);
        formData.append('address', address);
        if (photo) {
            formData.append('photo', photo); // 'photo' matches backend middleware
        }

        try {
            await axios.post('http://localhost:3001/api/customers', formData, {
                headers: { 'Content-Type': 'multipart/form-data' } // Important header
            });
            alert('Customer added!');
            setName('');
            setPhoneNumber('');
            setAddress('');
            setPhoto(null);
            document.getElementById('customerPhoto').value = null; // Clear file input
            onCustomerAdded(); 
        } catch (error) {
            console.error("Error adding customer:", error);
            alert('Failed to add customer.');
        }
    };

    return (
        <div className="card">
            <div className="card-body">
                <h3 className="card-title">Add New Customer</h3>
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="customerName" className="form-label">Name</label>
                        <input type="text" id="customerName" className="form-control" value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="customerPhone" className="form-label">Phone Number</label>
                        <input type="text" id="customerPhone" className="form-control" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="customerAddress" className="form-label">Address</label>
                        <input type="text" id="customerAddress" className="form-control" value={address} onChange={(e) => setAddress(e.target.value)} />
                    </div>
                    {/* --- ADD FILE INPUT --- */}
                    <div className="mb-3">
                        <label htmlFor="customerPhoto" className="form-label">Customer Photo</label>
                        <input 
                            type="file" 
                            id="customerPhoto" 
                            className="form-control" 
                            accept="image/*" 
                            onChange={handleFileChange} 
                        />
                    </div>
                    <button type="submit" className="btn btn-primary">Add Customer</button>
                </form>
            </div>
        </div>
    );
}

export default CustomerForm;