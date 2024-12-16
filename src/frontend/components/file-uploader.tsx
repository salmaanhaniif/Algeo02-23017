import React, { useState } from "react";

interface FileUploaderProps {
  onUpload: (file: File) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onUpload }) => {
  const [extractedFiles, setExtractedFiles] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const file = e.target.files[0];
      onUpload(file);

      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch("/api/upload-zip", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          setExtractedFiles(result.extractedFiles);
          setError(null);
        } else {
          const errorMessage = await response.text();
          setError(`Upload failed: ${errorMessage}`);
        }
      } catch (error) {
        setError("Error uploading ZIP file.");
        console.error("Error:", error);
      }
    }
  };

  return (
    <div className="file-uploader">
      <input
       type="file"
       accept=".zip,.rar" // Accept both .zip and .rar
       onChange={handleChange}
       className="hidden"
       id="file-upload"
       multiple // Allow multiple file uploads
      //  ref={(input) => {
      //   if (input) {
      //     (input as HTMLInputElement).webkitdirectory = true; // Type assertion here
      //   }
      // }} // Allow folder selection (for browsers that support it)
      />
      <label htmlFor="file-upload" className="upload-button z-50">
        +
      </label>

      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default FileUploader;
