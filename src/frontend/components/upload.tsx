import { writeFile } from "fs";
import { join } from "path";
import React, { useState } from "react";

export default function Upload() {
  const [selectedOption, setSelectedOption] = useState<string>('Select Image');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [audioURL, setAudioURL] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImagePreview(null);
      setAudioURL(null);
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
      } else if (file.type.startsWith("audio/")) {
        setImagePreview(null); // Reset image preview
        setAudioURL(URL.createObjectURL(file)); // Set audio URL
      } else {
        setImagePreview(null); // Reset image preview for non-image, non-audio files
        setAudioURL(null); // Reset audio URL
      }
    }
  };

  const handleOptionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedOption(e.target.value);
    setSelectedFile(null); // Clear the selected file when the dropdown option changes
    setImagePreview(null);

    setAudioURL(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      console.log("No file selected");
      return; // Don't proceed if no file is selected
    }

    // Prepare form data to send to server
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("selectedOption", selectedOption);

    try {
      // Make a POST request to the server with the form data
      const response = await fetch("/api/process-file-upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        console.log("File uploaded successfully");
      } else {
        console.error("File upload failed");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    }
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

  const playAudio = () => {
    const audio = document.getElementById("audioPlayer") as HTMLAudioElement;
    if (audio) {
      audio.play(); // Start playing the audio
    }
    return "";
  };

  return (
    <main>

    <form onSubmit={handleSubmit} className="flex flex-col justify-center items-center gap-3">
        {/* Dropdown to select file type */}
        <div className="flex justify-center items-center">
          <select
            className="px-4 py-2 rounded-md border border-gray-300 text-sm w-40"
            value={selectedOption}
            onChange={handleOptionChange} 
          >
            <option value="Select Image">Search Image</option>
            <option value="Select Audio">Search Audio</option>
            <option value="Upload Mapper">Upload Mapper</option>
          </select>
        </div>

        {selectedOption === "Select Audio" && selectedFile && (
        <div className="flex flex-col justify-center items-center gap-2">
          {/* Displaying the audio icon */}
          <span className="file-thumbnail text-4xl">🎵</span>

          {/* Audio player element */}
          {audioURL && (
            <audio id="audioPlayer" controls className="w-32">
              <source src={audioURL} type={selectedFile.type} />
              Your browser does not support the audio element.
            </audio>
          )}
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
        <div className="flex justify-center items-center mt-2 text-sm text-center text-gray-600 max-w-[150px] break-words whitespace-normal">
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
