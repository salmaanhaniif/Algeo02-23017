<<<<<<< HEAD
"use client";

import React, { useState, useEffect } from "react";
import FileUploader from "@/components/file-uploader";
import FileGrid from "@/components/file-grid";
import Pagination from "@/components/pagination";

interface AudioFile {
  fileName: string;
  url: string;
=======
import DragandDrop from "@/components/draganddrop";
import Image from "next/image";

export default function Home() {
  return (
    <div className="absolute inset-0 flex items-center justify-center min-h-screen">
      {/* <h1 className="text-2xl">Hello World!</h1> */}
      <DragandDrop/>
    </div>
  );
>>>>>>> abadc3f16c59868370cf831728c45a25d03187d3
}

const ITEMS_PER_PAGE = 28;

const MainPage = () => {
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fungsi untuk mengunggah file ZIP dan memproses file WAV
  const handleZipUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload-zip", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        setErrorMessage(`Upload failed: ${errorMessage}`);
        return;
      }

      const result = await response.json();
      const extractedFiles = result.extractedFiles || [];

      if (extractedFiles.length === 0) {
        setErrorMessage("No valid WAV files found in the ZIP.");
        return;
      }

      // Tambahkan file WAV ke audioFiles
      const newAudioFiles = extractedFiles.map((fileName: string) => ({
        fileName,
        url: `/uploads/${fileName}`, // Path ke file hasil ekstraksi
      }));

      setAudioFiles((prev) => [...prev, ...newAudioFiles]);
      setErrorMessage(null); // Reset error jika berhasil
    } catch (error) {
      console.error("Error uploading ZIP file:", error);
      setErrorMessage("An unexpected error occurred during upload.");
    }
  };

  // Fungsi untuk Play Audio
  const handlePlay = (audioFile: AudioFile) => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    const audio = new Audio(audioFile.url);
    audio.play();
    setCurrentAudio(audio);
    setIsPopupVisible(true);
  };

  // Fungsi untuk Pause dan Close Audio
  const handleClosePopup = () => {
    currentAudio?.pause();
    setCurrentAudio(null);
    setIsPopupVisible(false);
  };

  // Cleanup saat unmount
  useEffect(() => {
    return () => {
      currentAudio?.pause();
    };
  }, [currentAudio]);

  // Pagination
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const displayedFiles = audioFiles.slice(startIndex, endIndex);

  return (
    <main className="main-content">
      <section className="file-uploader-section mb-4">
        <FileUploader onUpload={handleZipUpload} />
        {errorMessage && (
          <p className="text-red-500 mt-2">{errorMessage}</p>
        )}
      </section>

      {/* Komponen FileGrid */}
      <FileGrid files={displayedFiles} onPlay={handlePlay} />

      {/* Pagination */}
      {audioFiles.length > ITEMS_PER_PAGE && (
        <Pagination
          page={currentPage}
          total={audioFiles.length}
          limit={ITEMS_PER_PAGE}
          onPageChange={(page) => setCurrentPage(page)}
        />
      )}

      {/* Pop-up Audio Player */}
      {isPopupVisible && currentAudio && (
        <div className="popup fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="popup-content bg-white p-6 rounded shadow-lg w-80">
            <h2 className="text-xl font-bold mb-4">Audio Player</h2>
            <button
              className="close-button bg-red-500 text-white px-4 py-2 rounded w-full"
              onClick={handleClosePopup}
            >
              ✖ Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

export default MainPage;
