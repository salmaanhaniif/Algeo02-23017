type UploadProps = {
    onUpload: (files: File[]) => void;
  };
  
  const Upload: React.FC<UploadProps> = ({ onUpload }) => {
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files) {
        onUpload(Array.from(files));
      }
    };
  
    return (
      <div>
        <input
          type="file"
          multiple
          accept=".wav"
          onChange={handleFileChange}
          className="file-upload-input"
        />
      </div>
    );
  };
  
  export default Upload;
  