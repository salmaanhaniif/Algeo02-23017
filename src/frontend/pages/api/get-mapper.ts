import fs from "fs";
import path from "path";
import { NextApiRequest, NextApiResponse } from "next";

// Helper function to determine if a file is an image or an audio file based on its extension
const isImage = (fileName: string) => {
  return /\.(jpg|jpeg|png)$/i.test(fileName);
};

const isAudio = (fileName: string) => {
  return /\.(wav|mid)$/i.test(fileName);
};

const detectDelimiter = (line: string) => {
  // Check for both comma and semicolon delimiters
  if (line.includes(",")) return ",";
  if (line.includes(";")) return ";";
  return "\uFFF9"; // Default to comma if both are missing
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Path to the mapper.txt file in the public/uploads directory
    const filePath = path.join(process.cwd(), "public", "uploads", "mapper.txt");

    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "mapper.txt not found." });
    }

    // Read the file content
    const fileContent = fs.readFileSync(filePath, "utf-8");

    // Split the content by new lines and process each line
    const lines = fileContent.split("\n").filter((line) => line.trim() !== "");

    // Detect the delimiter from the first line
    const delimiter = detectDelimiter(lines[0]);

    // Parse the CSV-like lines into an array of objects
    const mapperData = lines.map((line) => {
      const columns = line.split(delimiter);

      if (columns.length < 3) {
        // If there are less than 3 columns, it's invalid data
        return null;
      }

      // Initialize variables to store the mapped data
      let image = null;
      let audio = null;
      let title = null;
      let artist = null;

      // Check the first two columns to determine the type
      if (isImage(columns[1])) {
        image = columns[1];
      } else if (isAudio(columns[1])) {
        audio = columns[1];
      }

      if (isImage(columns[2])) {
        image = columns[2];
      } else if (isAudio(columns[2])) {
        audio = columns[2];
      }

      // The first column is the index (so we skip it)
      // The last two columns are title and artist (if they exist)
      if (columns.length > 3) {
        title = columns[columns.length - 2];
        artist = columns[columns.length - 1];
      }

      // Return the parsed object with all the data
      return {
        index: columns[0],
        image,
        audio,
        title,
        artist,
      };
    });

    // Filter out any null entries (invalid rows)
    const filteredMapperData = mapperData.filter((entry) => entry !== null);

    res.setHeader("Cache-Control", "no-store");

    // Send the response with the mapped data
    return res.status(200).json(filteredMapperData);
  } catch (error) {
    console.error("Error reading mapper file:", error);
    return res.status(500).json({ error: "Failed to process mapper.txt" });
  }
}
