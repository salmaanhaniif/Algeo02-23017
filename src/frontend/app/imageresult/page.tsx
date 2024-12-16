"use client";

import React, { useState, useEffect } from "react";
import FileUploader from "@/components/file-uploader";
import FileGridResultImage from "@/components/file-grid-result-image";
import Notification from "@/components/notification";
import { useLocation } from 'react-router-dom';

interface ImageResult {
  filename: string;
  similarity: string;
}

const MainPage = () => {
  // const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  
  // Fetch and attempt to parse 'imageresult' from the search params
  const imageresult = searchParams.get('imageresult');

  // State variables
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mapperData, setMapperData] = useState<any | null>(null);
  const [notification, setNotification] = useState({
    message: "",
    type: "success" as "success" | "error",
    visible: false,
  });

  // Handle file upload for ZIP
  const handleZipUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
  
    try {
      const response = await fetch("/api/upload-zip", {
        method: "POST",
        body: formData,
      });
      
      const data = await response.json();
      setNotification({
        message: data.message,
        type: "success", // Assuming success here, can be adjusted as needed.
        visible: true,
      });
  
      // Wait for a short duration before reloading the page
      setTimeout(() => {
        window.location.reload(); // Reload page after showing the notification
      }, 3000);
    } catch (error) {
      setNotification({
        message: "Failed to upload ZIP file.",
        type: "error",
        visible: true,
      });
    }
  };

  // Function to load the mapper data
  const loadMapper = async () => {
    try {
      const response = await fetch("/api/get-mapper");
      if (response.ok) {
        const data = await response.json();
        setMapperData(data); // Update the state with the mapper data
      } else {
        setMapperData([]); // If the mapper is not found, set an empty array
        setErrorMessage("Mapper data not found.");
      }
    } catch (error) {
      console.error("Error loading mapper data:", error);
      setMapperData([]); // Set to an empty array on error
      setErrorMessage("An unexpected error occurred while loading mapper data.");
    }
  };

  // Fetch the mapper data when the page is loaded
  useEffect(() => {
    loadMapper();
  }, []);

  const [isPopUpOpen, setIsPopUpOpen] = useState(false);

  // Parse 'imageresult' as an array of ImageResult if it's a valid JSON string, or handle it as a string
  let parsedImageResult: ImageResult[] | null = null;

  if (imageresult) {
    try {
      // Try to parse the imageresult as JSON (it's expected to be an array of { filename, similarity })
      parsedImageResult = JSON.parse(imageresult) as ImageResult[];
    } catch (error) {
      console.error("Failed to parse imageresult as JSON:", error);
      parsedImageResult = null; // If parsing fails, set it to null
    }
  }

  return (
    <main className="main-content">
      <section className="file-uploader-section mb-4">
        <FileUploader onUpload={handleZipUpload} />
        <Notification
          message={notification.message}
          type={notification.type}
          visible={notification.visible}
        />
      </section>
      
      {/* Pass the parsed 'imageresult' to FileGrid */}
      <FileGridResultImage
        mapperData={mapperData || []}  // Pass mapperData to FileGrid
        imageresult={parsedImageResult}           // Pass parsed image result (array or null)
      />
    </main>
  );
};

export default MainPage;
