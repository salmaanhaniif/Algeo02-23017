import { NextApiRequest, NextApiResponse } from "next";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { promisify } from "util";
import { execFile } from "child_process";
import AdmZip from "adm-zip";


// Folder tujuan untuk menyimpan file WAV
const uploadFolder = path.join(process.cwd(), "public", "uploads");

const imageFolder = path.join(uploadFolder, "images");
const audioFolder = path.join(uploadFolder, "audio");
const midiFolder = path.join(uploadFolder, "audiomidi");
const execFilePromise = promisify(execFile);

const ensureFolderExists = async (folderPath: string) => {
  try {
    await fs.mkdir(folderPath, { recursive: true });
  } catch (error) {
    console.error(`Failed to create folder: ${folderPath}`, error);
  }
};

ensureFolderExists(imageFolder);
ensureFolderExists(audioFolder);
ensureFolderExists(midiFolder);

// Konfigurasi Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const destinationPath = fileExtension === ".wav" || fileExtension === ".midi" ? audioFolder : imageFolder;
    console.log("Destination for file:", destinationPath);
    cb(null, destinationPath); // Store in audio or image folder
  },
  filename: (req, file, cb) => {
    // Ensure the filename is unique
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });


// Middleware untuk menangani multipart/form-data
const multerMiddleware = upload.single("file");

function runMiddleware(req: NextApiRequest, res: NextApiResponse, fn: any) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        
        return reject(result);
      }
      return resolve(result);
    });
  });
}

const deleteFolderContents = async (folderPath: string) => {
  try {
    const files = await fs.readdir(folderPath);
    console.log(`Deleting contents of: ${folderPath}`);
    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const stats = await fs.stat(filePath);
      if (stats.isDirectory()) {
        await deleteFolderContents(filePath);
      } else {
        await fs.unlink(filePath);
      }
    }
  } catch (error) {
    console.error("Error deleting folder contents:", error);
  }
};


async function convertWavToMidi(wavFile: string, midiFile: string) {
  try {
    const scriptPath = path.resolve(__dirname, "../../../../../backend/wavtomidi_database.py");
    const { stdout, stderr } = await execFilePromise("python3", [scriptPath, wavFile, midiFile]);
    // const { stdout, stderr } = await execFilePromise("python3", [
    //   "Algeo02-23017\src\backend\wavtomidi_database.py",
    //   wavFile,
    //   midiFile,
    // ]);
    console.log("WAV to MIDI conversion successful:", stdout);
    if (stderr) console.error("Warnings during WAV to MIDI:", stderr);
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error converting WAV to MIDI:", error.message);
    } else {
      console.error("Error converting WAV to MIDI:", error);
    }
    throw error;
  }
}


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      console.log("Starting file upload...");
      await runMiddleware(req, res, multerMiddleware);
      console.log("Multer middleware completed.");
      console.log("File received:", (req as any).file);

      const filePath = (req as any).file.path;
      console.log(`File uploaded successfully. File path: ${filePath}`);

      const zip = new AdmZip(filePath);
      const extractedFiles = zip.getEntries();
      console.log("Extracted files:", extractedFiles.map((entry) => entry.entryName));

      // Process file extraction and save logic...
      for (const entry of extractedFiles) {
        const fileExtension = path.extname(entry.entryName).toLowerCase();
        const originalFileName = path.basename(entry.entryName);

        if (fileExtension === ".wav") {
          const audioFilePath = path.join(audioFolder, originalFileName);
          await fs.writeFile(audioFilePath, entry.getData());
          const midiFilePath = path.join(midiFolder, originalFileName); //.replace(/\.wav$/, ".mid")
          await convertWavToMidi(audioFilePath, midiFilePath);
        } else if (fileExtension === ".mid") {
          const audioFilePath = path.join(audioFolder, originalFileName);
          const midiFilePath = path.join(midiFolder, originalFileName);
          await fs.writeFile(audioFilePath, entry.getData());
          await fs.writeFile(midiFilePath, entry.getData());
        } else if (fileExtension === ".jpg" || fileExtension === ".jpeg" || fileExtension === ".png") {
          await fs.writeFile(path.join(imageFolder, originalFileName), entry.getData());
        } else {
          console.log(`Unsupported file type: ${entry.entryName}`);
        }
      }

      // Delete ZIP file after processing
      await fs.unlink(filePath);

      res.status(200).json({ message: "ZIP file uploaded and processed successfully!" });
    } catch (error) {
      console.error("Error handling ZIP file:", error);
      res.status(500).json({
        message: "Failed to process ZIP file.",
        error: (error instanceof Error) ? error.message : String(error),
      });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}


export const config = {
  api: {
    bodyParser: false, // Nonaktifkan bodyParser bawaan Next.js
  },
};