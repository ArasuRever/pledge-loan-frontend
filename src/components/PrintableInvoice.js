import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';

// --- ⭐ FIX 1: Removed 'export' from this line ---
const PrintableInvoice = ({ loan, calculated, onClose }) => {
  const componentRef = useRef();
  
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-40">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl">
        
        {/* Header and Print Button */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Print Invoice</h2>
          <div>
            <button
              onClick={handlePrint}
              className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
            >
              Print
            </button>
            <button
              onClick={onClose}
              className="bg-gray-400 text-white px-4 py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div ref={componentRef} className="p-8 border rounded">
          <h1 className="text-3xl font-bold text-center mb-2">Sri Kubera Pawn</h1>
          <p className="text-center text-sm mb-6">123 Main St, Your Town, 12345 | Phone: (123) 456-7890</p>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <h3 className="text-lg font-semibold">Customer Details</h3>
              <p><strong>Name:</strong> {loan.customer_name}</p>
              <p><strong>Phone:</strong> {loan.phone_number}</p>
            </div>
            <div className="text-right">
              <h3 className="text-lg font-semibold">Loan Details</h3>
              <p><strong>Loan (Book #):</strong> {loan.book_loan_number}</p>
              <p><strong>Pledge Date:</strong> {new Date(loan.pledge_date).toLocaleDateString()}</p>
            </div>
          </div>

          <h3 className="text-lg font-semibold mb-2">Item Details</h3>
          <table className="min-w-full border mb-6">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-1 px-2 border">Description</th>
                <th className="py-1 px-2 border">Type</th>
                <th className="py-1 px-2 border">Weight</th>
                <th className="py-1 px-2 border">Quality</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-1 px-2 border">{loan.description}</td>
                <td className="py-1 px-2 border">{loan.item_type}</td>
                <td className="py-1 px-2 border">{loan.weight} g</td>
                <td className="py-1 px-2 border">{loan.quality}</td>
              </tr>
            </tbody>
          </table>

          <h3 className="text-lg font-semibold mb-2">Financial Summary</h3>
          <table className="min-w-full border mb-6">
            <tbody>
              <tr>
                <td className="py-1 px-2 border w-1/2">Principal Amount</td>
                <td className="py-1 px-2 border text-right">₹{parseFloat(loan.principal_amount).toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td className="py-1 px-2 border">Interest Rate</td>
                <td className="py-1 px-2 border text-right">{loan.interest_rate}% per month</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="py-1 px-2 border font-bold">Outstanding Principal</td>
                <td className="py-1 px-2 border text-right font-bold">₹{parseFloat(calculated.outstandingPrincipal).toLocaleString('en-IN')}</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="py-1 px-2 border font-bold">Outstanding Interest</td>
                <td className="py-1 px-2 border text-right font-bold">₹{parseFloat(calculated.outstandingInterest).toLocaleString('en-IN')}</td>
              </tr>
              <tr className="bg-gray-100">
                <td className="py-2 px-2 border text-xl font-bold">Total Amount Due</td>
                <td className="py-2 px-2 border text-right text-xl font-bold">₹{parseFloat(calculated.amountDue).toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>

          <div className="mt-8 text-xs text-gray-500">
            <p>Thank you for your business!</p>
            <p>Terms and conditions apply. Interest is calculated monthly.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- ⭐ FIX 2: Added this default export at the bottom ---
export default PrintableInvoice;