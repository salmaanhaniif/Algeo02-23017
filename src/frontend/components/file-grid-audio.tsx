import React, { useEffect, useState } from "react";
import Pagination from "@/components/pagination";
import { title } from "process";

interface FileData {
  fileName: string;
  url: string;
}

interface MapperData {
  index: string;
  image: string;
  audio: string;
  title: string;
  artist: string;
}

interface FileGridProps {
  mapperData: MapperData[];
}

const ITEMS_PER_PAGE = 32;

const FileGridAudio: React.FC<FileGridProps> = ({ mapperData = [] }) => {
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [audioFiles, setAudioFiles] = useState<string[]>([]); // List of audio files
  const [currentPage, setCurrentPage] = useState(1); // Current page for pagination
  const [totalPages, setTotalPages] = useState(1); // Total pages for pagination
  const [currentAudioFileName, setCurrentAudioFileName] = useState<string | null>(null);
  const audioDirectory = "uploads/audio"; // Path to audio directory
  const imageDirectory = "uploads/images"; // Path to image directory
  const [imageExists, setImageExists] = useState<Record<string, boolean>>({});
  
  // Use a ref to track image existence status (avoids unnecessary re-renders)

  useEffect(() => {
    const fetchAudioFiles = async () => {
      try {
        const response = await fetch(`/api/get-audio-files?timestamp=${new Date().getTime()}`);
        const data = await response.json();

        if (data.audioFiles) {
          setAudioFiles(data.audioFiles);
          setTotalPages(Math.ceil(data.audioFiles.length / ITEMS_PER_PAGE)); // Calculate total pages
        } else {
          console.error("Failed to fetch audio files.");
        }
      } catch (error) {
        console.error("Error fetching audio files:", error);
      }
    };

    fetchAudioFiles();
  }, []);

  // Slice audio files for pagination
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const displayedAudio = audioFiles.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePlay = (audioFile: FileData) => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    const audio = new Audio(audioFile.url);
    audio.play();
    setCurrentAudio(audio);
    setCurrentAudioFileName(audioFile.fileName); 
    setIsPopupVisible(true);
  };

  // Function to Pause and Close Audio
  const handleClosePopup = () => {
    currentAudio?.pause();
    setCurrentAudio(null);
    setCurrentAudioFileName(null); 
    setIsPopupVisible(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      currentAudio?.pause();
    };
  }, [currentAudio]);

  const checkImageExistence = async (imageName: string) => {
    try {
      const response = await fetch(`/api/check-image?imageName=${imageName}`);
      const data = await response.json();

      if (data.exists) {
        setImageExists((prev) => ({ ...prev, [imageName]: true }));
      } else {
        setImageExists((prev) => ({ ...prev, [imageName]: false }));
      }
    } catch (error) {
      console.error("Error checking image existence:", error);
    }
  };

  return (
    <section className="file-grid-container mt-5">
      {/* File grid */}
      <div className="file-grid mt-5 grid grid-cols-7 gap-4">
        {displayedAudio.map((audioFile, index) => {
          const mapperEntry = mapperData.find((file) => file.audio === audioFile);

          const imageUrl =
            mapperEntry 
              ? `${imageDirectory}/${mapperEntry.image}`
              : "🎵"; // Default icon if image is not found

          const title = mapperEntry?.title || "No Title";
          const artist = mapperEntry?.artist || "";

          const audioUrl = `${audioDirectory}/${audioFile}`;

          return (
            <div className="file-card bg-gray-100 rounded shadow" key={index}>
              <div className="file-thumbnail text-blue-500">
                {imageUrl !== "🎵" ? (
                  <img
                    src={imageUrl}
                    alt="🎵"
                    className=""
                  />
                ) : (
                  <span>{imageUrl}</span>
                )}
              </div>
              <p className="file-name text-sm text-gray-800 truncate">{title}</p>
              {artist && <p className="text-center text-xs text-gray-500">{artist}</p>}
              <button
                className="play-button bg-blue-500 text-white px-2 py-1 mt-2 rounded"
                onClick={() => handlePlay({ fileName: audioFile, url: audioUrl })}
              >
                ▶ Play
              </button>
            </div>
          );
        })}
      </div>

      {/* Popup Audio Player */}
      {isPopupVisible && currentAudio && (
        <div className="popup fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="popup-content bg-white p-6 rounded shadow-lg w-80">
            {(() => {
              const mapperEntry = mapperData.find((file) => file.audio === currentAudioFileName);
              const title = mapperEntry?.title || "No Title"; // Get the title or default to "No Title"
              const imageUrl = mapperEntry ? `${imageDirectory}/${mapperEntry.image}` : null;
              const artist = mapperEntry? mapperEntry.artist : null;

              return (
                <div className="popup-content-wrapper">
    
                {/* Display Image (if available) */}
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={title}
                    className="popup-image mx-auto mb-4 w-32 h-32 object-cover rounded"
                  />
                ) : (
                  <span className="file-thumbnail">🎵</span>
                )}
                {/* Display Title */}
                <h2 className="text-xl font-bold text-center">{title}</h2>
                {artist && <p className="text-sm text-gray-500 text-center">{artist}</p>}
              </div>
              );
            })()}
            <button
              className="close-button bg-red-500 text-white px-4 py-2 rounded w-full mt-4"
              onClick={handleClosePopup}
            >
              ✖ Close
            </button>
          </div>
        </div>
      )}
      {totalPages > 1 && (
        <div className="pagination-container mt-5 text-center">
          <Pagination
            page={currentPage}
            total={audioFiles.length}
            limit={ITEMS_PER_PAGE}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </section>
  );
};

export default FileGridAudio;
