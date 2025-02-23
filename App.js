import React, { useState } from 'react';
import MainPage from './MainPage';
import ResultsPage from './ResultsPage';
import './styles.css';

function App() {
  const [showResults, setShowResults] = useState(false);
  const [textOutput, setTextOutput] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  const handleFileUpload = async (files) => {
    const formData = new FormData();
    for (let file of files) {
        formData.append('files', file);
    }

    setUploadedFiles([...files]); 

    try {
        const response = await fetch('http://localhost:5000/upload', {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();
        // Handle the response from the Flask server (e.g., show results)
        console.log(data);
    } catch (error) {
        console.error('Error uploading files:', error);
    }
  };


  const handleGenerate = async () => {
    if (uploadedFiles.length < 1) {
        setErrorMessage('Please upload at least 1 file.');
        return;
    }

    setErrorMessage('');

    const formData = new FormData();
    uploadedFiles.forEach((file) => {
        formData.append('files', file);
    });

    // Debugging: Log contents of FormData
    for (let pair of formData.entries()) {
        console.log(`FormData Key: ${pair[0]}, Value:`, pair[1]);
    }

    try {
        const response = await fetch('http://localhost:5000/upload', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Failed to process files.');
        }
        
        const data = await response.json(); // Expecting JSON response from Flask

        // Debugging logs
        console.log("Response from Flask:", data);
        console.log("Extracted summary before setting textOutput:", data.summary);

        if (data.summary) {
            setTextOutput(JSON.stringify(data.summary, null, 2));
            console.log("Updated textOutput state:", JSON.stringify(data.summary, null, 2));
        } else {
            console.warn("Warning: No summary found in response!");
        }

        setShowResults(true);
    } catch (error) {
        console.error('Error:', error);
        setErrorMessage('Error processing files. Please try again.');
    }
};


  

  return (
    <div className="App">
      {!showResults ? (
        <>
          <MainPage onFileUpload={handleFileUpload} />

          {/* Upload container */}
          <div className="upload-container">
            <label htmlFor="file-upload" className="upload-icon">
              <input
                type="file"
                id="file-upload"
                style={{ display: 'none' }}
                onChange={(e) => handleFileUpload(e.target.files)}
                multiple // Allow multiple file uploads
              />
            </label>

            {/* Render uploaded files with images instead of file icons */}
            <div className="uploaded-files">
              {uploadedFiles.map((file, index) => (
                <div className="file-preview" key={index}>
                  {/* Show uploaded file preview or default SVG */}
                  <img
                    src={file ? URL.createObjectURL(file) : '/file.svg'}
                    alt="Uploaded file"
                    className="file-image"
                    width="40"
                    height="40"
                  />
                  <span className="file-name">{file.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <button className="generate-button" onClick={handleGenerate}>
            Generate
          </button>

          {/* Error message */}
          {errorMessage && <div className="error-message">{errorMessage}</div>}
        </>
      ) : (
        <ResultsPage textOutput={textOutput} />
      )}
    </div>
  );
}

export default App;