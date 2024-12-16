import React, { useState } from "react";

export default function Upload() {
  const [selectedOption, setSelectedOption] = useState<string>('Select Image');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<any>(null); // Untuk menyimpan hasil pencarian
  const [showModal, setShowModal] = useState<boolean>(false); // Untuk mengontrol modal

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
        // case if they were searching for an image
        if (selectedOption === "Select Image"){
          const querySearchResponse = await fetch("http://localhost:8080/api/image-search", {
            method: "POST",
            body: formData,
          });
          if (querySearchResponse.ok) {
            const result = await querySearchResponse.json();
            
            // Hanya tampilkan nama file yang ditemukan
            if (result) {
              console.log("File found:", result);
              setSearchResult(result);
              setShowModal(true);
            } else {
              setSearchResult("No matching files found.");
              setShowModal(true);
            }
            console.log("Files found:", searchResult);
          }
        } else if (selectedOption === "Select Audio") { // case if they were searching for an audio
          const querySearchResponse = await fetch("http://127.0.0.1:9696/search", {
            method: "POST",
            body: formData,
          });
          if (querySearchResponse.ok) {
            const result = await querySearchResponse.json();
            
            // Hanya tampilkan nama file yang ditemukan
            if (result.matches) {
              console.log("File found:", result.matches);
              setSearchResult(result.matches);
              setShowModal(true);
            } else {
              setSearchResult("No matching files found.");
              setShowModal(true);
            }
            console.log("Files found:", searchResult);
          }
        } else { // case if they were uploading mapper
          console.log("Successfully uploaded mapper file")
        }
      // if (response.ok) {
      //   console.log("File uploaded successfully");
      //   const querySearchResponse = await fetch("http://localhost:8080/api/image-search", {
      //     method: "POST",
      //     body: formData,
      //   });

      //   if (querySearchResponse.ok) {
      //     const result = await querySearchResponse.json();
      //     if (result && result.length > 0) {
      //       console.log("Files found:", result);
      //       setSearchResult(result); // Store search result
      //       setShowModal(true); // Show modal with the result
      //     } else {
      //       setSearchResult("No matching files found.");
      //       setShowModal(true); // Show modal with no result message
      //     }
      //   }
      // } else {
      //   console.error("File upload failed");
      // }
    }} catch (error) {
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

      {/* Modal Popup for search results */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={() => setShowModal(false)}>
          <div
            className="bg-white p-6 rounded-lg max-w-2xl w-full space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-center mb-4">Search Results</h2>
            {searchResult ? (
              Array.isArray(searchResult) ? (
                searchResult.map((result: any, index: number) => (
                  <div key={index} className="flex flex-col justify-center items-center mb-4">
                    { selectedOption === "Select Image" ? 
                     <img
                     src={`/uploads/images/${result.filename}`} // Ensure the correct path for the image
                     alt={result.filename}
                     className="w-20 h-20 object-cover mb-2"  // mb-2 adds some margin below the image
                    />
                    : 
                    <span className="file-thumbnail text-4xl">🎵</span>
                    }
                 
                  <div className="text-center">
                    <p><strong>Filename:</strong> {result.filename}</p>
                    <p><strong>Similarity:</strong> {result.similarity}</p>
                  </div>
                </div>
                ))
              ) : (

                <p className="text-center">{searchResult}</p>
              )
            ) : (
              <p>Loading results...</p>
            )}

            <button
              onClick={() => setShowModal(false)}
              className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
