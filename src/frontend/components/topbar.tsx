// src/components/TopBar.tsx
import React from "react";
import { Search, Bell, User } from "lucide-react"; // Ikon dari lucide-react

const TopBar: React.FC = () => {
  return (
    <div className="bg-gray-800 text-white px-4 py-3 flex items-center justify-between z-10">
      <div className="text-xl font-bold">
        <a href="/">Audio Searcher</a>
      </div>
    </div>
  );
};

export default TopBar;
