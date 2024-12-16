// src/components/TopBar.tsx
import React from "react";
import { Search, Bell, User } from "lucide-react"; // Ikon dari lucide-react

const TopBar: React.FC = () => {
  return (
    <div className="bg-gray-800 text-white px-4 py-3 flex items-center justify-between z-10">
  <div className="text-xl font-bold">
    <a href="/">Audio Searcher</a>
  </div>

  {/* Search bar on the top right */}
    <div className="flex items-center">
      <input
        type="text"
        placeholder="Search..."
        className="px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
      />
      <button className="ml-2 text-white bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-md">
        Search
      </button>
    </div>
  </div>

  );
};

export default TopBar;
