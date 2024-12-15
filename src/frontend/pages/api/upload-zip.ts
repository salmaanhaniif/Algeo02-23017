import { NextApiRequest, NextApiResponse } from "next";
import multer from "multer";
import path from "path";
import fs from "fs";
import AdmZip from "adm-zip";

// Folder tujuan untuk menyimpan file WAV
const uploadFolder = path.join(process.cwd(), "public", "uploads");

// Pastikan folder tujuan ada
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder, { recursive: true });
}

// Konfigurasi Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadFolder); // Simpan file sementara di folder uploads
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname); // Penamaan file
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      // Jalankan middleware Multer
      await runMiddleware(req, res, multerMiddleware);

      // Path file ZIP yang diunggah
      const filePath = (req as any).file.path;

      // Ekstraksi file ZIP
      const zip = new AdmZip(filePath);
      zip.extractAllTo(uploadFolder, true);

      // Filter hanya file WAV
      const extractedFiles = zip.getEntries().filter((entry) =>
        entry.entryName.endsWith(".wav")
      );

      // Hapus file ZIP setelah ekstraksi
      fs.unlinkSync(filePath);

      res.status(200).json({
        message: "ZIP file uploaded and extracted successfully!",
        extractedFiles: extractedFiles.map((file) => file.entryName),
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
