import { writeFile } from "fs";
import { join } from "path";
import React, { useState } from "react";

export default function Upload() {
  const [selectedOption, setSelectedOption] = useState<string>('Select Image');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const file = e.target.files[0];
      setSelectedFile(file);
      console.log("File selected:", file);
      console.log("Selected Option:", selectedOption); // Log the selected option (Image or Audio)

      if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setImagePreview(null); // Reset if not an image
      }
    }
  };

  const handleOptionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedOption(e.target.value);
    setSelectedFile(null); // Clear the selected file when the dropdown option changes
    setImagePreview(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted with file:", selectedFile);
    console.log("Selected Option:", selectedOption);
  };

  const getAcceptTypes = () => {
    if (selectedOption === "Select Image") {
      return ".jpg,.jpeg,.png"; // Accept only image file types
    } else if (selectedOption === "Select Audio") {
      return ".wav,.mid"; // Accept only audio file types
    } else if (selectedOption === "Upload Mapper") {
      return ".txt"; // Accept only text files for Mapper
    }
    return "";
  };

  return (
    <main>
    <form onSubmit={handleSubmit} className="flex flex-col justify-center items-center gap-2">
        {/* Dropdown to select file type */}
        <div className="flex justify-center items-center">
          <select
            className="px-4 py-2 rounded-md border border-gray-300 text-sm w-40"
            value={selectedOption}
            onChange={handleOptionChange} 
          >
            <option value="Select Image">Search Image</option>
            <option value="Select Audio">Search Audio</option>
          </select>
        </div>

        {selectedOption === "Select Audio" && selectedFile && (
          <div className="flex justify-center items-center mt-2">
            <span className="file-thumbnail text-4xl">🎵</span>
          </div>
        )}

        {selectedOption === "Select Image" && imagePreview && (
          <div className="mt-4">
            <img
              src={imagePreview}
              alt={selectedFile?.name}
              className="w-40 h-40 object-cover rounded-md"
            />
          </div>
        )}

        {/* File name display */}
        <div className="flex justify-center items-center mt-2 text-sm text-gray-600">
          {selectedFile ? selectedFile.name : "No file selected"}
        </div>

        {/* Choose File button */}
        <div className="flex text-center justify-center items-center">
          <label
            htmlFor="filePicker"
            className="bg-blue-500 text-white px-4 py-2 rounded-md cursor-pointer text-center w-40 text-sm"
          >
            Choose File
          </label>
          <input
            id="filePicker"
            type="file"
            className="opacity-0 absolute w-0 h-0"
            onChange={handleFileChange}
            accept={getAcceptTypes()} 
          />
        </div>

        {/* Upload button */}
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded-md cursor-pointer text-center w-40 text-sm"
        >
          Upload
        </button>
      </form>
    </main>
  );
}
