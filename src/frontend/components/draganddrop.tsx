"use client";
import React, { useState } from 'react';
import { useDropzone, DropzoneOptions, Accept } from 'react-dropzone';
import Papa from 'papaparse'; // Install papaparse library to handle CSV parsing

// Define types for the file content and the component's state
const DragandDrop: React.FC = () => {
  const [file, setFile] = useState<File | null>(null); // Type for the file is File
  const [fileContent, setFileContent] = useState<string>(''); // To display file content
  const [isCsv, setIsCsv] = useState<boolean>(false); // Check if the file is a CSV
  const [separator, setSeparator] = useState<string>('comma'); // Default separator is comma
  const [uploadStatus, setUploadStatus] = useState<string>(''); // To track the upload status

  // Type for Dropzone options (optional, but good for clarity)
  const dropzoneOptions: DropzoneOptions = {
    onDrop: (acceptedFiles: File[]) => {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile); // Set the selected file
      processFileContent(selectedFile); // Process the content of the file
    },
    accept: {
        'text/csv': ['.csv'],
        'text/plain': ['.txt'],
    }, 
  };

  const { getRootProps, getInputProps } = useDropzone(dropzoneOptions);

  // Handle file selection manually (for the button click)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      processFileContent(selectedFile);
    }
  };

  // Function to process the file content (for text or CSV files)
  const processFileContent = (file: File) => {
    const reader = new FileReader();

    // For .csv files, we'll use PapaParse to parse the content
    if (file.name.endsWith('.csv')) {
      setIsCsv(true); // Set that the file is a CSV
      reader.onload = () => {
        const fileContent = reader.result as string;
        // Check if the content uses comma or semicolon
        const delimiter = fileContent.includes(';') ? ';' : ',';
        setSeparator(delimiter === ';' ? 'semicolon' : 'comma');
        
        Papa.parse(fileContent, {
          complete: (result) => {
            // We can handle the result here, displaying CSV data as text for now
            setFileContent(JSON.stringify(result.data, null, 2));  // Pretty print CSV data
          },
          delimiter: delimiter, // Automatically detects comma or semicolon
        });
      };
    }
    
    // For .txt files, we'll directly display the content
    else if (file.name.endsWith('.txt')) {
      setIsCsv(false);
      reader.onload = () => {
        setFileContent(reader.result as string);  // Save the file content for txt files
      };
    }

    reader.readAsText(file); // Read as text (works for both CSV and TXT)
  };

  // Function to upload the file to the Go backend
  const uploadFile = async () => {
    if (!file) {
      alert('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file); // The key must be 'file', as per the Go handler

    try {
      setUploadStatus('Uploading...');
      const response = await fetch('http://localhost:8080/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setUploadStatus('File uploaded and processed successfully!');
      } else {
        setUploadStatus('File upload failed');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadStatus('Error uploading file');
    }
  };

  return (
    <div className="flex w-full max-w-7xl min-h-screen bg-gray-100">
      {/* Main content */}
      <div className="flex-grow p-6 bg-white rounded-lg shadow-lg mt-12 w-full">
        <h1 className="text-2xl font-bold mb-4 text-center">Drag and Drop or Select a File</h1>

        <div
          {...getRootProps()}
          className="flex justify-center items-center p-6 border-4 border-dashed border-gray-300 rounded-md cursor-pointer hover:border-blue-500"
        >
          <input {...getInputProps()} />
          <p className="text-gray-600 text-center">
            Drag and drop your file here, or click to select a file
          </p>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={() => {
              const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
              fileInput?.click();
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Select a File
          </button>
        </div>

        {file && (
          <div className="mt-4 text-center">
            <p className="text-gray-800">Selected File:</p>
            <p className="text-blue-600">{file.name}</p>
          </div>
        )}

        {fileContent && (
          <div className="mt-4 p-4 bg-gray-200 rounded-md">
            <h2 className="text-lg font-bold">File Content:</h2>
            <pre className="text-sm text-gray-700">{fileContent}</pre>
          </div>
        )}

        {/* Display additional information about CSV separator */}
        {isCsv && (
          <div className="mt-4 text-center">
            <p className="text-gray-800">
              Detected separator: <span className="text-blue-600">{separator}</span>
            </p>
          </div>
        )}

        {/* Upload Status */}
        {uploadStatus && (
          <div className="mt-4 text-center">
            <p className="text-gray-800">{uploadStatus}</p>
          </div>
        )}

        {/* Upload Button */}
        <div className="mt-4 text-center">
          <button
            onClick={uploadFile}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
          >
            Upload File
          </button>
        </div>
      </div>
    </div>
  );
};

export default DragandDrop;
