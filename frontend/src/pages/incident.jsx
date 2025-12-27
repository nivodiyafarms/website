import React, { useState, useMemo } from 'react';

// Define the main App component
export default function App() {
  const [formData, setFormData] = useState({
    caseNo: '', // Initial state for caseNo is now empty string for the dropdown
    season: 'Kharif',
    crop: 'Wheat',
    seedCategory: '',
    sowingDate: '',
    targetCompletionDate: '',
    currentStage: 'New',
    cancellationReason: '',
    totalExpense: 0,
    totalRevenue: 0,
    resolvedDate: '',
    actualHarvestDate: '',
    resolutionComments: '',
    observation: '',
    briefDescription: '',
    description: '',
    remarks: '',
  });

  const [isSubmitted, setIsSubmitted] = useState(false);

  // Helper function for input changes
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    let newValue = value;

    // Convert number inputs to actual numbers for calculation
    if (type === 'number') {
      newValue = parseFloat(value) || 0;
    }

    setFormData(prev => ({
      ...prev,
      [name]: newValue,
    }));
  };

  // Auto-calculate Profit (Labh)
  const calculatedProfit = useMemo(() => {
    return (formData.totalRevenue - formData.totalExpense).toFixed(2);
  }, [formData.totalRevenue, formData.totalExpense]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real application, you would handle data submission here (e.g., calling an API or saving to Firestore).
    console.log('Form Data Submitted:', formData);
    setIsSubmitted(true);
  };

  // Define options for dropdowns and radio buttons
  const stageOptions = [
    'New', 'In Progress', 'On Hold', 'Resolved', 'Reopen', 'Closed', 'Cancelled'
  ];
  const seasonOptions = ['Kharif', 'Rabi', 'Zaid'];
  const cropOptions = ['Wheat', 'Rice', 'Corn', 'Cotton', 'Sugarcane'];
  
  // Case ID options extracted from user request (split into 6-character IDs)
  const caseIdOptions = [
    'HQ0001', 'NIB001', 'NIA001', 'NID005', 'NID006', 'NID001', 'NID002', 'NID003', 'NID004', 
    'NID007', 'NID008', 'NID009', 'BAD010', 'BAD011', 'NIA002', 'NIA003', 'NIA004', 'NIA005', 
    'HIA006', 'HIA007', 'HIA008', 'HIA009', 'NIB002', 'NIB003', 'NIB004', 'NIB005', 'NIB006', 
    'NIB007', 'HAB008', 'NIB009', 'NIB010', 'NIC001', 'NIC002', 'NIC003', 'BAC004', 'BAC005', 
    'BAC006', 'BAC007', 'NID012', 'NID013', 'NID014', 'NID015', 'NID016', 'NIC008'
  ];

  // Conditional Rendering Logic for status-related fields
  const isCancelled = formData.currentStage === 'Cancelled';
  const isResolved = formData.currentStage === 'Resolved' || formData.currentStage === 'Closed';
  const isHolding = formData.currentStage === 'On Hold';
  const isEditable = !isSubmitted;

  const InputField = ({ label, name, type = 'text', placeholder = '', min = 0, required = false, disabled = false, className = '' }) => (
    <div className={`flex flex-col ${className}`}>
      <label htmlFor={name} className="text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {type === 'textarea' ? (
        <textarea
          id={name}
          name={name}
          value={formData[name]}
          onChange={handleChange}
          rows={type === 'textarea' && name.includes('description') ? 4 : 2}
          placeholder={placeholder}
          className="p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 bg-white shadow-sm disabled:bg-gray-100 disabled:text-gray-500"
          required={required}
          disabled={!isEditable || disabled}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={formData[name]}
          onChange={handleChange}
          placeholder={placeholder}
          min={min}
          className="p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 bg-white shadow-sm disabled:bg-gray-100 disabled:text-gray-500"
          required={required}
          disabled={!isEditable || disabled}
        />
      )}
    </div>
  );

  const SelectField = ({ label, name, options }) => (
    <div className="flex flex-col">
      <label htmlFor={name} className="text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select
        id={name}
        name={name}
        value={formData[name]}
        onChange={handleChange}
        className="p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 bg-white shadow-sm disabled:bg-gray-100 disabled:text-gray-500"
        disabled={!isEditable}
      >
        <option value="" disabled={formData[name] !== ""}>Select Case ID</option>
        {options.map(option => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </div>
  );

  const StageSelector = () => (
    <div className="flex flex-col">
      <h3 className="text-sm font-medium text-gray-700 mb-2">वर्तमान चरण / Current Stage</h3>
      <div className="flex flex-wrap gap-x-4 gap-y-2 p-3 bg-white border border-indigo-200 rounded-lg shadow-inner">
        {stageOptions.map(stage => (
          <label key={stage} className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="currentStage"
              value={stage}
              checked={formData.currentStage === stage}
              onChange={handleChange}
              className="text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              disabled={!isEditable}
            />
            <span className="text-sm font-medium text-gray-900">{stage}</span>
          </label>
        ))}
      </div>
      {(isCancelled || isHolding) && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <label className="block text-sm font-semibold text-yellow-800 mb-1">
            {isCancelled ? 'रद्द करने का कारण / Cancellation Reason' : 'रोकने का कारण / Reason for Hold'}
            <span className="text-red-500">*</span>
          </label>
          <textarea
            name={isCancelled ? 'cancellationReason' : 'holdReason'}
            value={isCancelled ? formData.cancellationReason : formData.holdReason}
            onChange={handleChange}
            rows="2"
            className="w-full p-2 border border-yellow-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500 transition duration-150"
            required={true}
            disabled={!isEditable}
          />
          {isCancelled && (
            <p className="mt-2 text-xs text-yellow-700">
              *After resolved status should be changed to Closed after 7 days auto-call if it does not Reopened.
            </p>
          )}
        </div>
      )}
    </div>
  );


  // Render the main application
  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-['Inter']">
      <div className="max-w-4xl mx-auto bg-white p-6 md:p-10 rounded-xl shadow-2xl">
        <h1 className="text-3xl font-bold text-center mb-6 text-indigo-700">Incident/Work Order Form</h1>
        <p className="text-center text-gray-500 mb-8">फार्म आवश्यकताएँ / Farm Requirements</p>

        {isSubmitted && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6" role="alert">
            <strong className="font-bold">Success!</strong>
            <span className="block sm:inline"> Form data logged to console.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* --- Section 1: Basic Information (Header Row) --- */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border-b pb-6">
            <SelectField 
              label="केस क्रमांक (ID only)" 
              name="caseNo" 
              options={caseIdOptions} 
            />
            <SelectField label="सीज़न / Season" name="season" options={seasonOptions} />
            <SelectField label="फ़सल / Crop" name="crop" options={cropOptions} />
            <InputField label="बीज कैटेगरी (Text)" name="seedCategory" placeholder="Seed Type 1" />
          </div>

          {/* --- Section 2: Dates and Current Stage --- */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <InputField label="बुवाई की तारीख / Sowing Date" name="sowingDate" type="date" required={true} />
            <InputField label="समाप्ति तारीख़ (लक्ष्य) / Target Completion Date" name="targetCompletionDate" type="date" required={true} />
            <div className="md:col-span-1">
              <StageSelector />
            </div>
          </div>

          {/* --- Section 3: Resolution & Financials (Pink Box Layout) --- */}
          <div className="bg-pink-50 border-t-4 border-pink-300 rounded-lg p-6 shadow-md">
            <h2 className="text-xl font-semibold text-pink-800 mb-4">समाधान टिप्पणियाँ / Resolution Details</h2>
            <p className="text-xs text-pink-600 mb-4">**(when the incident is resolved mandatory to fill)**</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Financial Fields */}
              <div className="space-y-4">
                <InputField
                  label="कुल व्यय / Total Expense (Rs)"
                  name="totalExpense"
                  type="number"
                  min="0"
                  placeholder="90000"
                  required={isResolved}
                  className="bg-white"
                />
                <InputField
                  label="कुल आय / Total Revenue (Rs)"
                  name="totalRevenue"
                  type="number"
                  min="0"
                  placeholder="100000"
                  required={isResolved}
                  className="bg-white"
                />
                <InputField
                  label="लाभ (रु. में) / Profit (in Rs)"
                  name="profit"
                  value={calculatedProfit}
                  disabled={true} // Auto-calculated field
                  className="bg-white"
                />
              </div>

              {/* Date and Comment Fields */}
              <div className="space-y-4">
                <InputField
                  label="समाधान तिथि / Resolved Date"
                  name="resolvedDate"
                  type="date"
                  required={isResolved}
                  disabled={!isResolved} // Only enabled when resolved
                  placeholder="Autofill when the task is resolved"
                  className="bg-white"
                />
                <InputField
                  label="वास्तविक कटाई की तारीख / Actual Harvest Date"
                  name="actualHarvestDate"
                  type="date"
                  required={isResolved}
                  disabled={!isResolved}
                  className="bg-white"
                />
                <InputField
                  label="समाधान टिप्पणियाँ / Resolution Comments"
                  name="resolutionComments"
                  type="textarea"
                  placeholder="Enter detailed resolution steps."
                  required={isResolved}
                  disabled={!isResolved}
                  className="bg-white"
                />
                <InputField
                  label="निरीक्षण टिप्पणी / Observation"
                  name="observation"
                  type="textarea"
                  placeholder="Enter observations."
                  className="bg-white"
                />
              </div>
            </div>
          </div>

          {/* --- Section 4: Description and Remarks --- */}
          <div className="space-y-6 pt-4">
            <h2 className="text-xl font-semibold text-gray-700">विवरण / Description</h2>
            <InputField
              label="संक्षिप्त विवरण / Brief Description"
              name="briefDescription"
              placeholder="Summary of the issue or work done"
              required={true}
            />
            <InputField
              label="विवरण / Detailed Description"
              name="description"
              type="textarea"
              placeholder="Enter the full, detailed description here."
              required={true}
            />
            <InputField
              label="टिप्पणियाँ / Remarks"
              name="remarks"
              type="textarea"
              placeholder="Comments (with respect to employee Name/ID - like a chat)"
            />
            <div className="text-sm text-gray-500 pt-2">
              (Should be able to Attach: photos, audio, docs - *Attachment component not implemented in this draft*)
            </div>
          </div>

          {/* --- Submission Button --- */}
          <div className="pt-6">
            <button
              type="submit"
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-lg transition duration-200 ease-in-out transform hover:scale-[1.01] focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50 disabled:bg-indigo-400"
              disabled={!isEditable}
            >
              {isEditable ? 'Submit Work Order' : 'Form Submitted'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}