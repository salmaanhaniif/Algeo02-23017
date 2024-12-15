import { writeFile } from "fs";
import { join } from "path";
import React from "react";

export default function Upload() {
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      alert("File uploaded successfully!");
    } else {
      alert("Failed to upload file.");
    }
  };

  return (
    <main>
        <form onSubmit={(e) => { e.preventDefault(); handleFileChange(e as any); }}>
            <input type="file" onChange={handleFileChange} className="mt-10 w-15 h-10 border-black"/>
            <button type="submit" className="mt-5 ml-12 bg-blue-500 text-white text-sm w-[60px] justify-center">Upload</button>
        </form>
    </main>
  );
}
