// pages/api/get-audio-files.ts
import fs from "fs";
import path from "path";
import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const audioDirectory = path.join(process.cwd(), "public", "uploads", "audio");

  try {
    // Read all the files in the audio directory
    const files = fs.readdirSync(audioDirectory);

    // Filter out non-audio files (e.g., images or other files)
    const audioFiles = files.filter((file) =>
      file.endsWith(".wav") || file.endsWith(".mid")
    );

    // Return the list of audio files
    res.status(200).json({ audioFiles });
  } catch (error) {
    res.status(500).json({ error: "Failed to read audio files" });
  }
}
