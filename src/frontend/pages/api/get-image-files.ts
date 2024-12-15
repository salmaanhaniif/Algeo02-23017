// pages/api/get-audio-files.ts
import fs from "fs";
import path from "path";
import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const imageDirectory = path.join(process.cwd(), "public", "uploads", "images");

  try {
    // Read all the files in the audio directory
    const files = fs.readdirSync(imageDirectory);

    // Filter out non-audio files (e.g., images or other files)
    const imageFiles = files.filter((file) =>
      file.endsWith(".jpg") || file.endsWith(".png") || file.endsWith(".jpeg")
    );

    // Return the list of audio files
    res.status(200).json({ imageFiles });
  } catch (error) {
    res.status(500).json({ error: "Failed to read audio files" });
  }
}
