import React, { useEffect, useState } from "react";
import Pagination from "@/components/pagination";

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

const ITEMS_PER_PAGE = 28;

const FileGridImage: React.FC<FileGridProps> = ({ mapperData = [] }) => {
  const [imageFiles, setImageFiles] = useState<string[]>([]); // List of image files
  const [imageExists, setImageExists] = useState<Record<string, boolean>>({}); // Track existence of images
  const [currentPage, setCurrentPage] = useState(1); // Current page for pagination
  const [totalPages, setTotalPages] = useState(1); // Total pages for pagination
  const imageDirectory = "uploads/images"; // Path to image directory

  useEffect(() => {
    const fetchImageFiles = async () => {
      try {
        const response = await fetch(`/api/get-image-files?timestamp=${new Date().getTime()}`);
        const data = await response.json();

        if (data.imageFiles) {
          setImageFiles(data.imageFiles);
          setTotalPages(Math.ceil(data.imageFiles.length / ITEMS_PER_PAGE)); // Calculate total pages
        } else {
          console.error("Failed to fetch image files.");
        }
      } catch (error) {
        console.error("Error fetching image files:", error);
      }
    };

    fetchImageFiles();
  }, []);

  // Check if the image exists in the directory
  const checkImageExistence = async (imageName: string) => {
    try {
      const response = await fetch(`/api/check-image?imageName=${imageName}`);
      const data = await response.json();
      setImageExists((prev) => ({ ...prev, [imageName]: data.exists }));
    } catch (error) {
      console.error("Error checking image existence:", error);
    }
  };

  useEffect(() => {
    // Check existence of each image when the component is mounted
    imageFiles.forEach((imageFile) => {
      checkImageExistence(imageFile);
    });
  }, [imageFiles]);

  // Slice image files for pagination
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const displayedImages = imageFiles.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <section className="file-grid-container mt-5">
      {/* File grid */}
      <div className="file-grid mt-5 grid grid-cols-7 gap-4">
        {displayedImages.map((imageFile, index) => {
          const mapperEntry = mapperData.find((file) => file.image === imageFile);

          const title = mapperEntry?.title || "No Title";
          const artist = mapperEntry?.artist || "";

          const imageUrlPath = `${imageDirectory}/${imageFile}`;
          const imageExistsFlag = imageExists[imageFile];

          return (
            <div className="file-card p-4 bg-gray-100 rounded shadow" key={index}>
              <div className="file-thumbnail text-blue-500 mb-2">
                {imageExistsFlag ? (
                  <img
                    src={imageUrlPath}
                    alt={title}
                    className="w-16 h-16 text-sm object-cover"
                  />
                ) : (
                  <span>🎨</span> // Show fallback icon if image doesn't exist
                )}
              </div>
              <p className="file-name text-sm text-gray-800 truncate">{title}</p>
              {artist && <p className="text-xs text-gray-500">{artist}</p>}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination-container mt-5 text-center">
          <Pagination
            page={currentPage}
            total={imageFiles.length}
            limit={ITEMS_PER_PAGE}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </section>
  );
};

export default FileGridImage;
