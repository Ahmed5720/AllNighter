import React, { useRef, useState } from 'react';

function MainPage({ onFileUpload }) {
    const fileInputRef = useRef(null);
    const [studyHours, setStudyHours] = useState(''); // State to store the number of study hours

    const handleGeneratePlanClick = () => {
        fileInputRef.current.click(); // Trigger file input
    };

    const handleFileChange = (e) => {
        if (e.target.files.length > 0) {
            onFileUpload(e.target.files); // Pass files to parent component
        }
    };

    const handleStudyHoursChange = (e) => {
        setStudyHours(e.target.value); // Update the study hours state
    };

    return (
        <div className="page">
            <h1>All Nighter</h1>
            <button onClick={handleGeneratePlanClick}>Upload PDFs of Previous Exams</button>
            <input
                type="file"
                ref={fileInputRef}
                accept=".pdf"
                multiple
                style={{ display: 'none' }}
                onChange={handleFileChange}
            />
            
            {/* Parent div for the new input fields */}
            <div className="study-hours-container">
                <p>How many Studying-Hours do you have?</p>
                <input
                    type="number"
                    value={studyHours}
                    onChange={handleStudyHoursChange}
                    placeholder="Enter study hours"
                />
            </div>

            <p>Generate a plan.</p>
        </div>
    );
}

console.log('MainPage.jsx loaded');
export default MainPage;