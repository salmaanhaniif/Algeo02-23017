import { NextApiRequest, NextApiResponse } from "next";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import AdmZip from "adm-zip";
const unrar: any = require('unrar.js');


// Folder tujuan untuk menyimpan file WAV
const uploadFolder = path.join(process.cwd(), "public", "uploads");

const imageFolder = path.join(uploadFolder, "images");
const audioFolder = path.join(uploadFolder, "audio");

const ensureFolderExists = async (folderPath: string) => {
  try {
    await fs.mkdir(folderPath, { recursive: true });
  } catch (error) {
    console.error(`Failed to create folder: ${folderPath}`, error);
  }
};

ensureFolderExists(imageFolder);
ensureFolderExists(audioFolder);

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

const extractRarFile = async (filePath: string, destination: string) => {
  try {
    const buffer = await fs.readFile(filePath);
    const unrarStream = unrar.createStream(buffer);

    // Explicitly typing the files array
    const files: any[] = [];

    // Extract files from the RAR archive
    unrarStream.on("file", (file: any) => {
      files.push(file);
    });

    unrarStream.on("end", async () => {
      for (const file of files) {
        const filePath = path.join(destination, file.fileHeader.name);
        await fs.writeFile(filePath, file.data);
        console.log("Saved file:", file.fileHeader.name);
      }
    });

    unrarStream.on("error", (error: Error) => {
      console.error("Error extracting RAR file:", error);
    });

    unrarStream.end();
  } catch (error) {
    console.error("Error reading RAR file:", error);
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      // Jalankan middleware Multer
      console.log("Starting file upload...");
      await runMiddleware(req, res, multerMiddleware);
      console.log("Multer middleware completed.");

      // Path file ZIP yang diunggah
      const filePath = (req as any).file.path;
      console.log(`File uploaded successfully. File path: ${filePath}`);

      // Ekstraksi file ZIP
      const fileExtension = path.extname(filePath).toLowerCase();
      let clearAudioFolder = false;
      let clearImageFolder = false;
      let savedAudio = false;
      let savedImage = false;

      // Inspect the extracted files to determine what type of files they are
      // const zip = new AdmZip(filePath);
      // const extractedFiles = zip.getEntries();
      // extractedFiles.forEach((entry) => {
      //   const fileExtension = path.extname(entry.entryName).toLowerCase();
      //   if (fileExtension === ".wav" || fileExtension === ".midi") {
      //     clearAudioFolder = true; // Set flag to clear audio folder
      //   } else if (fileExtension === ".jpg" || fileExtension === ".jpeg" || fileExtension === ".png") {
      //     clearImageFolder = true; // Set flag to clear image folder
      //   }
      // });

      // // Clear only the relevant folder(s)
      // if (clearAudioFolder) {
      //   await deleteFolderContents(audioFolder);
      //   console.log("Cleared audio folder");
      // }
      // if (clearImageFolder) {
      //   await deleteFolderContents(imageFolder);
      //   console.log("Cleared image folder");
      // }

      // // Extract all files to the appropriate folder(s)
      // extractedFiles.forEach((entry) => {
      //   const fileExtension = path.extname(entry.entryName).toLowerCase();
      //   console.log("Processing file:", entry.entryName);

      //   if (fileExtension === ".wav" || fileExtension === ".midi") {
      //     savedAudio = true;
      //     console.log("Saving audio file:", entry.entryName);
      //     fs.writeFile(path.join(audioFolder, entry.entryName), entry.getData());
      //   } else if (fileExtension === ".jpg" || fileExtension === ".jpeg" || fileExtension === ".png") {
      //     savedImage = true;
      //     console.log("Saving image file:", entry.entryName);
      //     fs.writeFile(path.join(imageFolder, entry.entryName), entry.getData());
      //   } else {
      //     console.log("Unsupported file type in ZIP:", entry.entryName);
      //   }
      // });

      if (fileExtension === ".zip") {
        const zip = new AdmZip(filePath);
        const extractedFiles = zip.getEntries();
        extractedFiles.forEach((entry) => {
          const ext = path.extname(entry.entryName).toLowerCase();
          if (ext === ".wav" || ext === ".midi") {
            clearAudioFolder = true; // Set flag to clear audio folder
          } else if (ext === ".jpg" || ext === ".jpeg" || ext === ".png") {
            clearImageFolder = true; // Set flag to clear image folder
          }
        });

        // Clear relevant folders if necessary
        if (clearAudioFolder) await deleteFolderContents(audioFolder);
        if (clearImageFolder) await deleteFolderContents(imageFolder);

        // Extract the files from ZIP archive
        extractedFiles.forEach((entry) => {
          const ext = path.extname(entry.entryName).toLowerCase();
          console.log("Processing file:", entry.entryName);

          if (ext === ".wav" || ext === ".midi") {
            savedAudio = true;
            fs.writeFile(path.join(audioFolder, entry.entryName), entry.getData());
          } else if (ext === ".jpg" || ext === ".jpeg" || ext === ".png") {
            savedImage = true;
            fs.writeFile(path.join(imageFolder, entry.entryName), entry.getData());
          }
        });
      }

      // Handle RAR file
      // if (fileExtension === ".rar") {
      //   let rarFiles: any[] = [];

      //   // Handle RAR file extraction using unrar.js
      //   try {
      //     const extracted = unrar(Buffer);
      //     rarFiles = extracted.getFiles();
      //   } catch (error) {
      //     console.error("Error extracting RAR file:", error);
      //   }

      //   const hasAudio = rarFiles.some(file => ["wav", "midi"].includes(path.extname(file.name).toLowerCase()));
      //   const hasImage = rarFiles.some(file => ["jpg", "jpeg", "png"].includes(path.extname(file.name).toLowerCase()));

      //   // Clear the relevant folder based on the file types
      //   if (hasAudio) {
      //     clearAudioFolder = true;
      //   }
      //   if (hasImage) {
      //     clearImageFolder = true;
      //   }

      //   // Clear the relevant folder(s)
      //   if (clearAudioFolder) await deleteFolderContents(audioFolder);
      //   if (clearImageFolder) await deleteFolderContents(imageFolder);

      //   // Extract the files to the appropriate folder
      //   rarFiles.forEach(async (file) => {
      //     const ext = path.extname(file.fileHeader.name).toLowerCase();
      //     console.log("Processing file:", file.fileHeader.name);

      //     if (ext === ".wav" || ext === ".midi") {
      //       savedAudio = true;
      //       await fs.writeFile(path.join(audioFolder, file.fileHeader.name), file.data);
      //     } else if (ext === ".jpg" || ext === ".jpeg" || ext === ".png") {
      //       savedImage = true;
      //       await fs.writeFile(path.join(imageFolder, file.fileHeader.name), file.data);
      //     }
      //   });
      // }

      // Clean up the uploaded ZIP file
      fs.unlink(filePath);

      let message = "ZIP file uploaded and extracted successfully!";
      if (savedAudio && savedImage) {
        message += " Files were saved to both the audio and image folders.";
      } else if (savedAudio) {
        message += " Files were saved to the audio folder.";
      } else if (savedImage) {
        message += " Files were saved to the image folder.";
      }

      // Process mapperData and extract required info
      res.status(200).json({
        message: message,
      });

    } catch (error) {
      console.error("Error handling ZIP file:", error);
      res.status(500).json({ message: "Failed to process ZIP file." });
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