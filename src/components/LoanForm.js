import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

function LoanForm({ customerId, onLoanAdded }) {
  // Form state
  const [principal, setPrincipal] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [bookLoanNumber, setBookLoanNumber] = useState('');
  const [itemType, setItemType] = useState('gold');
  const [description, setDescription] = useState('');
  const [quality, setQuality] = useState('');
  const [weight, setWeight] = useState('');

  // Photo handling state
  const [photoSource, setPhotoSource] = useState('upload');
  const [itemPhoto, setItemPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const videoRef = useRef(null); // Ref for the video element
  const canvasRef = useRef(null); // Ref for the canvas element
  const streamRef = useRef(null); // Ref to hold the active stream

  // Cleanup camera on unmount/disable
  useEffect(() => {
    return () => stopCameraStream();
  }, []);

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setIsCameraOn(false);
      // Ensure video srcObject is cleared
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setItemPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
      stopCameraStream(); // Turn off camera if switching to upload
    }
  };

  const startCamera = async () => {
    stopCameraStream(); // Ensure previous stream is stopped cleanly
    setItemPhoto(null);
    setPhotoPreview(null);
    try {
      // Request video stream
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream; // Store the stream
      // CRITICAL: Attach the stream to the video element's srcObject
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Wait for video metadata to load to ensure dimensions are available
         videoRef.current.onloadedmetadata = () => {
             setIsCameraOn(true); // Set camera on state AFTER stream is attached
         };
      } else {
         console.error("Video element ref not available");
         setIsCameraOn(false); // Ensure state reflects reality
         stopCameraStream(); // Stop stream if video element isn't ready
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please ensure permissions are granted and no other app is using it.");
      setIsCameraOn(false);
      stopCameraStream(); // Clean up if failed
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current && isCameraOn) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      // Set canvas dimensions based on actual video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(blob => {
        if (blob) {
          setItemPhoto(blob);
          setPhotoPreview(canvas.toDataURL('image/jpeg')); // Use Data URL for immediate preview
          stopCameraStream(); // Turn off camera after capture
        }
      }, 'image/jpeg');
    } else {
       console.error("Cannot capture photo: camera not ready or refs missing.");
    }
  };

   const clearPhoto = () => {
     setItemPhoto(null);
     setPhotoPreview(null);
     stopCameraStream();
     const fileInput = document.getElementById('itemPhotoInput');
     if (fileInput) fileInput.value = null;
   };

  const handleSubmit = async (e) => {
      e.preventDefault();
      const formData = new FormData();
      formData.append('customer_id', customerId);
      formData.append('principal_amount', principal);
      formData.append('interest_rate', interestRate);
      formData.append('book_loan_number', bookLoanNumber);
      formData.append('item_type', itemType);
      formData.append('description', description);
      formData.append('quality', quality);
      formData.append('weight', weight);
      if (itemPhoto) {
        const fileName = itemPhoto instanceof File ? itemPhoto.name : 'capture.jpg';
        formData.append('itemPhoto', itemPhoto, fileName);
      }

      try {
        await axios.post('http://localhost:3001/api/loans', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        alert('New loan added!');
        setPrincipal(''); setInterestRate(''); setBookLoanNumber(''); setItemType('gold');
        setDescription(''); setQuality(''); setWeight(''); clearPhoto();
        onLoanAdded();
      } catch (error) {
        if (error.response) alert(error.response.data);
        else alert('Failed to add new loan.');
      }
  };

  return (
    <div className="card my-4">
      <div className="card-body">
        <h4 className="card-title">Create New Pledge</h4>
        <form onSubmit={handleSubmit}>
          {/* --- Text Input Fields (ALWAYS VISIBLE) --- */}
          <div className="row">
            {/* Book Loan Number */}
            <div className="col-md-6 mb-3">
              <label htmlFor="bookLoanNumber" className="form-label">Book Loan Number</label>
              <input type="text" id="bookLoanNumber" className="form-control" value={bookLoanNumber} onChange={e => setBookLoanNumber(e.target.value)} required />
            </div>
             {/* Principal Amount */}
            <div className="col-md-6 mb-3">
               <label htmlFor="principalAmount" className="form-label">Principal Amount (₹)</label>
               <input type="number" id="principalAmount" className="form-control" value={principal} onChange={e => setPrincipal(e.target.value)} required />
             </div>
             {/* Interest Rate */}
            <div className="col-md-6 mb-3">
               <label htmlFor="interestRate" className="form-label">Interest Rate (%)</label>
               <input type="number" step="0.01" id="interestRate" className="form-control" value={interestRate} onChange={e => setInterestRate(e.target.value)} required />
             </div>
             {/* Item Type */}
             <div className="col-md-6 mb-3">
               <label htmlFor="itemType" className="form-label">Item Type</label>
               <select id="itemType" className="form-select" value={itemType} onChange={e => setItemType(e.target.value)}>
                 <option value="gold">Gold</option>
                 <option value="silver">Silver</option>
               </select>
             </div>
             {/* Item Description */}
            <div className="col-12 mb-3">
              <label htmlFor="itemDescription" className="form-label">Item Description</label>
              <input type="text" id="itemDescription" className="form-control" value={description} onChange={e => setDescription(e.target.value)} required />
            </div>
            {/* Quality */}
            <div className="col-md-6 mb-3">
              <label htmlFor="itemQuality" className="form-label">Quality</label>
              <input type="text" id="itemQuality" className="form-control" value={quality} onChange={e => setQuality(e.target.value)} />
            </div>
            {/* Weight */}
            <div className="col-md-6 mb-3">
              <label htmlFor="itemWeight" className="form-label">Weight (grams)</label>
              <input type="number" step="0.001" id="itemWeight" className="form-control" value={weight} onChange={e => setWeight(e.target.value)} />
            </div>
          </div>

          {/* --- Photo Upload/Capture Section (CONDITIONAL RENDERING IS HERE) --- */}
          <div className="mb-3">
            <label className="form-label d-block">Pledged Item Photo</label>
            <div className="mb-2">
              <div className="form-check form-check-inline">
                <input className="form-check-input" type="radio" name="photoSource" id="uploadRadio" value="upload" checked={photoSource === 'upload'} onChange={() => { setPhotoSource('upload'); stopCameraStream(); clearPhoto(); }} />
                <label className="form-check-label" htmlFor="uploadRadio">Upload File</label>
              </div>
              <div className="form-check form-check-inline">
                <input className="form-check-input" type="radio" name="photoSource" id="captureRadio" value="capture" checked={photoSource === 'capture'} onChange={() => { setPhotoSource('capture'); clearPhoto(); }} />
                <label className="form-check-label" htmlFor="captureRadio">Take Photo</label>
              </div>
            </div>

            {/* Conditional rendering for upload input */}
            {photoSource === 'upload' && (
              <input type="file" id="itemPhotoInput" className="form-control" accept="image/*" onChange={handleFileChange} />
            )}

            {/* Conditional rendering for capture components */}
            {photoSource === 'capture' && (
              <div>
                {!isCameraOn && !photoPreview && (
                  <button type="button" className="btn btn-secondary mb-2" onClick={startCamera}>Start Camera</button>
                )}
                {isCameraOn && (
                   <div>
                     <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', maxWidth: '300px', marginBottom: '10px', border:'1px solid #ccc' }}></video>
                     <div>
                       <button type="button" className="btn btn-success me-2" onClick={capturePhoto}>Capture</button>
                       <button type="button" className="btn btn-warning" onClick={stopCameraStream}>Cancel</button>
                     </div>
                   </div>
                )}
                <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
              </div>
            )}

            {/* Photo Preview (always shown if photoPreview exists, regardless of source) */}
            {photoPreview && (
              <div className="mt-3">
                <h6>Preview:</h6>
                <img src={photoPreview} alt="Item preview" style={{ maxWidth: '150px', maxHeight: '150px', border:'1px solid #ccc' }} />
                <button type="button" className="btn btn-sm btn-outline-danger ms-2 align-bottom" onClick={clearPhoto}>Clear Photo</button>
              </div>
            )}
          </div>
          {/* --- END PHOTO SECTION --- */}

          <button type="submit" className="btn btn-primary mt-3">Create Loan</button>
        </form>
      </div>
    </div>
  );
}

export default LoanForm;