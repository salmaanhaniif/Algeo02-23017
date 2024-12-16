interface AudioFile {
  fileName: string; // Nama file untuk ditampilkan
  url: string; // URL untuk memutar file audio
}

interface FileGridProps {
  files: AudioFile[];
  onPlay: (file: AudioFile) => void;
}

const FileGrid: React.FC<FileGridProps> = ({ files, onPlay }) => {
  return (
    <section className="file-grid mt-5 grid grid-cols-7 gap-4">
      {files.map((file, index) => (
        <div className="file-card p-4 bg-gray-100 rounded shadow" key={index}>
          <div className="file-thumbnail text-4xl text-blue-500 mb-2">🎵</div>
          <p className="file-name text-sm text-gray-800 truncate">
            {file.fileName}
          </p>
          <button
            className="play-button bg-blue-500 text-white px-2 py-1 mt-2 rounded"
            onClick={() => onPlay(file)}
          >
            ▶ Play
          </button>
        </div>
      ))}
    </section>
  );
};

export default FileGrid;
