// src/pages/EditLoanPage.js
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

function EditLoanPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    // Form State
    const [loanDetails, setLoanDetails] = useState(null);
    const [bookLoanNumber, setBookLoanNumber] = useState('');
    const [interestRate, setInterestRate] = useState('2.5');
    const [pledgeDate, setPledgeDate] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [itemType, setItemType] = useState('gold');
    const [description, setDescription] = useState('');
    const [quality, setQuality] = useState('');
    const [weight, setWeight] = useState('');

    // Image State
    const [currentItemPhotoUrl, setCurrentItemPhotoUrl] = useState(null);
    const [newItemPhotoFile, setNewItemPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [removeItemImage, setRemoveItemImage] = useState(false);
    const fileInputRef = useRef();

    // Loading/Error State
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Helper to format date for input
    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            const offset = date.getTimezoneOffset();
            const adjustedDate = new Date(date.getTime() - (offset*60*1000));
            return adjustedDate.toISOString().split('T')[0];
        } catch (e) { console.error("Error formatting date:", dateString, e); return ''; }
    };

    // Fetch existing loan data
    useEffect(() => {
        const fetchLoanData = async () => {
            setIsLoading(true); setError(null);
            try {
                const response = await axios.get(`http://localhost:3001/api/loans/${id}`);
                const data = response.data.loanDetails;
                setLoanDetails(data);
                setBookLoanNumber(data.book_loan_number || '');
                setInterestRate(String(data.interest_rate || '2.5'));
                setPledgeDate(formatDateForInput(data.pledge_date));
                setDueDate(formatDateForInput(data.due_date));
                setItemType(data.item_type || 'gold');
                setDescription(data.description || '');
                setQuality(data.quality || '');
                setWeight(String(data.weight || ''));
                setCurrentItemPhotoUrl(data.item_image_data_url || null);
            } catch (err) {
                console.error("Error fetching loan data for edit:", err);
                if (err.response?.status === 404) { setError("Loan not found."); }
                else { setError("Failed to load loan data."); }
            } finally { setIsLoading(false); }
        };
        fetchLoanData();
    }, [id]);

    // Handle New Photo Selection
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setNewItemPhotoFile(file);
            // *** THIS IS THE CORRECTED LINE ***
            setPhotoPreview(URL.createObjectURL(file)); // Use URL.createObjectURL
            // **********************************
            setCurrentItemPhotoUrl(null);
            setRemoveItemImage(false);
        }
    };

    // Handle Clear New Photo / Revert
    const clearNewPhoto = () => {
        setNewItemPhotoFile(null);
        setPhotoPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = null;
        if (loanDetails?.item_image_data_url) {
             setCurrentItemPhotoUrl(loanDetails.item_image_data_url);
        }
    };

    // Handle Form Submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        const formData = new FormData();
        formData.append('book_loan_number', bookLoanNumber);
        formData.append('interest_rate', interestRate);
        formData.append('pledge_date', pledgeDate);
        formData.append('due_date', dueDate);
        formData.append('item_type', itemType);
        formData.append('description', description);
        formData.append('quality', quality);
        formData.append('weight', weight);
        if (newItemPhotoFile) { formData.append('itemPhoto', newItemPhotoFile, newItemPhotoFile.name); formData.append('removeItemImage', 'false'); }
        else if (removeItemImage) { formData.append('removeItemImage', 'true'); }

        try {
            const response = await axios.put(`http://localhost:3001/api/loans/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            alert(response.data.message || 'Loan updated successfully!');
            navigate(`/loans/${id}`);
        } catch (err) {
            console.error("Error updating loan:", err);
            if (err.response?.data?.error) { setError(err.response.data.error); }
            else { setError('Failed to update loan.'); }
        }
    };

    // Render Loading/Error States
    if (isLoading) return <div className="text-center mt-5">Loading loan details for editing...</div>;
    if (error && !loanDetails) return <div className="alert alert-danger"><p>{error}</p><Link to="/loans">Back to Loans</Link></div>;

    // Render Form
    return (
        <div>
            <h2>Edit Loan Details (ID: {id})</h2>
            <hr />
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleSubmit}>
                {/* Loan Information */}
                <h4>Loan Information</h4>
                <div className="row g-3 mb-4">
                    <div className="col-md-6"> <label htmlFor="bookLoanNumber" className="form-label">Book Loan Number</label> <input type="text" id="bookLoanNumber" className="form-control" value={bookLoanNumber} onChange={e => setBookLoanNumber(e.target.value)} required /> </div>
                    <div className="col-md-6"> <label htmlFor="interestRate" className="form-label">Monthly Interest Rate (%)</label> <select id="interestRate" className="form-select" value={interestRate} onChange={e => setInterestRate(e.target.value)} required > <option value="1.0">1.0%</option> <option value="1.5">1.5%</option> <option value="2.0">2.0%</option> <option value="2.5">2.5%</option> <option value="3.0">3.0%</option> <option value="3.5">3.5%</option> </select> </div>
                    <div className="col-md-6"> <label htmlFor="pledgeDate" className="form-label">Pledge Date</label> <input type="date" id="pledgeDate" className="form-control" value={pledgeDate} onChange={e => setPledgeDate(e.target.value)} required /> </div>
                    <div className="col-md-6"> <label htmlFor="dueDate" className="form-label">Due Date</label> <input type="date" id="dueDate" className="form-control" value={dueDate} onChange={e => setDueDate(e.target.value)} required /> </div>
                </div>
                {/* Pledged Item Information */}
                <h4>Pledged Item Information</h4>
                <div className="row g-3 mb-4">
                    <div className="col-md-6"> <label htmlFor="itemType" className="form-label">Item Type</label> <select id="itemType" className="form-select" value={itemType} onChange={e => setItemType(e.target.value)} > <option value="gold">Gold</option> <option value="silver">Silver</option> </select> </div>
                    <div className="col-md-6"> <label htmlFor="itemDescription" className="form-label">Item Description</label> <input type="text" id="itemDescription" className="form-control" value={description} onChange={e => setDescription(e.target.value)} required /> </div>
                    <div className="col-md-6"> <label htmlFor="itemQuality" className="form-label">Quality</label> <input type="text" id="itemQuality" className="form-control" value={quality} onChange={e => setQuality(e.target.value)} /> </div>
                    <div className="col-md-6"> <label htmlFor="itemWeight" className="form-label">Weight (grams)</label> <input type="number" step="0.001" id="itemWeight" className="form-control" value={weight} onChange={e => setWeight(e.target.value)} /> </div>
                    {/* Item Photo Edit */}
                    <div className="col-12">
                         <label htmlFor="itemPhotoInput" className="form-label">Update Item Photo (Optional)</label>
                         <input type="file" className="form-control" id="itemPhotoInput" accept="image/*" onChange={handleFileChange} ref={fileInputRef} />
                         {(photoPreview || currentItemPhotoUrl) && (
                            <div className="mt-2">
                                <p className='mb-1 small'>Photo Preview:</p>
                                <img src={photoPreview || currentItemPhotoUrl} alt="Item Preview" style={{ maxHeight: '100px', maxWidth: '100px', border: '1px solid #ccc', borderRadius: '4px' }} />
                                {photoPreview && ( <button type="button" onClick={clearNewPhoto} className="btn btn-sm btn-outline-secondary ms-2 align-bottom">Cancel Upload</button> )}
                            </div>
                         )}
                         {currentItemPhotoUrl && !photoPreview && (
                            <div className="form-check mt-2">
                                <input className="form-check-input" type="checkbox" id="removeItemImageCheck" checked={removeItemImage} onChange={e => setRemoveItemImage(e.target.checked)} />
                                <label className="form-check-label" htmlFor="removeItemImageCheck"> Remove current photo </label>
                            </div>
                         )}
                    </div>
                </div>
                {/* Action Buttons */}
                <div className="mt-4"> <button type="submit" className="btn btn-primary me-2">Save Changes</button> <button type="button" className="btn btn-secondary" onClick={() => navigate(`/loans/${id}`)}>Cancel</button> </div>
            </form>
        </div>
    );
}

export default EditLoanPage;