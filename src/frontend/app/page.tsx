"use client";

import React, { useState, useEffect } from "react";
import FileUploader from "@/components/file-uploader";
import FileGridAudio from "@/components/file-grid-audio";
import Notification from "@/components/notification";
import FileGrid from "@/components/file-grid";
import Pagination from "@/components/pagination";
import Mapper from "../components/showmapper";

interface FileData {
  fileName: string;
  url: string;
}

const MainPage = () => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mapperData, setMapperData] = useState<any | null>(null);
  const [notification, setNotification] = useState({
    message: "",
    type: "success" as "success" | "error",
    visible: false,
  });

  // Fungsi untuk mengunggah file ZIP dan memproses file WAV
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

      {/* Komponen FileGrid */}
      <FileGridAudio
            mapperData={mapperData || []} // Pass mapperData to FileGrid
          />

    {/* <div>
      <h1>My Next.js Page</h1>
      <button onClick={() => setIsPopUpOpen(true)}>Show Pop-Up</button>
      <Mapper isOpen={isPopUpOpen} onClose={() => setIsPopUpOpen(false)} />
    </div> */}

      {/* Pop-up Audio Player */}
      
    </main>
  );
};

export default MainPage;