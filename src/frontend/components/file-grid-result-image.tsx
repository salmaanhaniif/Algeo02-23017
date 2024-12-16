import React from "react";

interface MapperData {
  index: string;
  image: string;
  audio: string;
  title: string;
  artist: string;
}

interface FileGridProps {
  mapperData: MapperData[];
  imageresult: { filename: string; similarity: string }[] | null;
}

const ITEMS_TO_DISPLAY = 5; // Max number of images to display

const FileGridResultImage: React.FC<FileGridProps> = ({ mapperData = [], imageresult }) => {
  // If imageresult is null or empty, display message
  if (imageresult === null || imageresult.length === 0) {
    return (
      <section className="file-grid-container mt-5">
        <div className="text-center text-lg font-bold mt-10">
          No image that is similar found in dataset
        </div>
      </section>
    );
  } else { // case there is a result
    return (
      <section className="file-grid-container mt-5">
        <h2 className="text-center text-lg font-semibold mt-10">Similar Images</h2>
  
        {/* Display the first 5 images from imageresult */}
        <div className="file-grid mt-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {imageresult.slice(0, ITEMS_TO_DISPLAY).map((result, index) => {
            // Find the corresponding mapper data for the image
            const mapperEntry = mapperData.find((file) => file.image === result.filename);
            const title = mapperEntry?.title || "No Title"; // Get title or default to "No Title"
            const imageUrlPath = `/uploads/images/${result.filename}`; // Assuming image files are in this directory
  
            return (
              <div className="file-card bg-white rounded shadow" key={index}>
                {/* Image */}
                <div className="text-blue-500">
                  <img
                    src={imageUrlPath}
                    alt={title}
                    className="text-sm h-32 w-full object-cover"
                  />
                </div>
                
                {/* Image Details */}
                <p className="file-name text-sm text-gray-800 truncate">{result.filename}</p>
                <p className="text-xs text-gray-500">{title}</p>
                <p className="text-xs text-gray-400">Similarity: {result.similarity}</p>
              </div>
            );
          })}
        </div>
      </section>
    );
  }
};

export default FileGridResultImage;
