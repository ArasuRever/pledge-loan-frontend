import React, { useState, useEffect } from 'react';
import axios from 'axios';

// This form will receive the current customer data and an update handler
function EditCustomerForm({ customer, onUpdate, onCancel }) {
    // Initialize state with existing customer data
    const [name, setName] = useState(customer.name || '');
    const [phoneNumber, setPhoneNumber] = useState(customer.phone_number || '');
    const [address, setAddress] = useState(customer.address || '');
    const [photo, setPhoto] = useState(null); // New photo file

    // This is necessary to re-initialize form state if the customer prop changes
    useEffect(() => {
        setName(customer.name || '');
        setPhoneNumber(customer.phone_number || '');
        setAddress(customer.address || '');
    }, [customer]);


    const handleFileChange = (e) => {
        setPhoto(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('name', name);
        formData.append('phone_number', phoneNumber);
        formData.append('address', address);

        // Logic to handle photo update/removal
        if (photo) {
            formData.append('photo', photo); 
        } else if (!customer.customer_image_url && customer.id) {
            // If there's no new photo AND no existing photo, we send nothing.
        } else if (customer.customer_image_url && !photo) {
            // If there's an existing photo and the user didn't select a new one, we tell the backend to KEEP it.
            formData.append('keepExistingPhoto', 'true');
        } else if (!customer.customer_image_url && photo) {
            // If a user clicks 'Remove Photo' (a feature we'll add later)
            formData.append('removeCurrentImage', 'true');
        }


        try {
            // Use PUT request for updating
            await axios.put(`http://localhost:3001/api/customers/${customer.id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('Customer updated successfully!');
            onUpdate(); // Tell parent component to refresh data
        } catch (error) {
            console.error("Error updating customer:", error);
            alert('Failed to update customer.');
        }
    };

    return (
        <div className="card my-4 p-3 border-warning">
            <div className="card-body">
                <h3 className="card-title text-warning">Edit Customer Details</h3>
                <form onSubmit={handleSubmit}>
                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <label htmlFor="editName" className="form-label">Name</label>
                            <input type="text" id="editName" className="form-control" value={name} onChange={(e) => setName(e.target.value)} required />
                        </div>
                        <div className="col-md-6 mb-3">
                            <label htmlFor="editPhone" className="form-label">Phone Number</label>
                            <input type="text" id="editPhone" className="form-control" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
                        </div>
                        <div className="col-12 mb-3">
                            <label htmlFor="editAddress" className="form-label">Address</label>
                            <input type="text" id="editAddress" className="form-control" value={address} onChange={(e) => setAddress(e.target.value)} />
                        </div>
                        <div className="col-12 mb-3">
                            <label htmlFor="editPhoto" className="form-label">Update Photo</label>
                            {customer.customer_image_url && <small className="text-muted d-block">Current photo exists. Select new file to replace.</small>}
                            <input type="file" id="editPhoto" className="form-control" accept="image/*" onChange={handleFileChange} />
                        </div>
                        <div className="col-12">
                            <button type="submit" className="btn btn-warning me-2">Save Changes</button>
                            <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EditCustomerForm;