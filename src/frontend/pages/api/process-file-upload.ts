import fs from "fs/promises";
import path from "path";
import multer from "multer";
import type { NextApiRequest, NextApiResponse } from "next";

// Setup folder paths
const uploadFolder = path.join(process.cwd(), "public", "query");
const imageFolder = path.join(uploadFolder, "image");
const audioFolder = path.join(uploadFolder, "audio");
const mapperPath = path.join(process.cwd(), "public", "uploads");

// Ensure folders exist
const ensureFolderExists = async (folderPath: string) => {
  try {
    await fs.mkdir(folderPath, { recursive: true });
  } catch (error) {
    console.error(`Failed to create folder: ${folderPath}`, error);
  }
};

ensureFolderExists(imageFolder);
ensureFolderExists(audioFolder);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Default folder to save files if selectedOption is not set
    let destinationPath = mapperPath;

    // Access the selectedOption from req.body (after Multer handles the form-data)
    const selectedOption = req.body.selectedOption;
    console.log("Selected option:", selectedOption);

    // Choose the folder based on the selected option
    if (selectedOption === "Select Image") {
      destinationPath = imageFolder;
    } else if (selectedOption === "Select Audio") {
      destinationPath = audioFolder;
    }

    console.log("Destination for file:", destinationPath);
    cb(null, destinationPath); // Store in the appropriate folder
  },
  filename: (req, file, cb) => {
    console.log("Saving file:", file.originalname);
    cb(null, file.originalname); // Use original file name
  },
});

// Initialize Multer upload
const upload = multer({ storage });

// Middleware to handle file upload
const multerMiddleware = upload.single("file");

// Function to run middleware
function runMiddleware(req: NextApiRequest, res: NextApiResponse, fn: any) {
  return new Promise((resolve, reject) => {
    // console.log("Running middleware...");
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        // console.error("Error in Multer middleware:", result);
        return reject(result);
      }
      // console.log("Multer middleware completed.");
      return resolve(result);
    });
  });
}

// Function to delete file if exists
const deleteFileIfExists = async (filePath: string) => {
  try {
    // Try to access the file to check if it exists
    await fs.access(filePath);
    // If access is successful, delete the file
    await fs.unlink(filePath);
    console.log(`Deleted file: ${filePath}`);
  } catch (error) {
    // If the file does not exist, it will throw an error, but we can safely ignore it
    console.log(`No file found to delete at: ${filePath}`);
  }
};

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      console.log("Starting file upload...");
      await runMiddleware(req, res, multerMiddleware); // Run the Multer middleware
      console.log("Multer middleware completed.");

      // After Multer processes the file, we can access `selectedOption` and the file path
      const selectedOption = req.body.selectedOption;
      const filePath = (req as any).file.path;
      const fileName = (req as any).file.originalname;

      console.log(`File uploaded successfully. File path: ${filePath}`);
      console.log(`Selected option: ${selectedOption}`);

      // Determine the target folder based on the selected option
      let targetFolder = "";
      if (selectedOption === "Select Image") {
        targetFolder = imageFolder;
      } else if (selectedOption === "Select Audio") {
        targetFolder = audioFolder;
      } else if (selectedOption === "Upload Mapper") {
        targetFolder = mapperPath;
      }

      // Delete the existing file in the target folder, if any
      let targetFilePath = "";
      if (targetFolder === mapperPath){
        targetFilePath = path.join(targetFolder, "mapper.txt");
        await deleteFileIfExists(targetFilePath);
      } else {
        targetFilePath = path.join(targetFolder, fileName);
        await deleteFolderContents(targetFolder);
      }
     

      // Move the uploaded file to the target folder
      await fs.rename(filePath, targetFilePath);
      console.log(`File saved to: ${targetFilePath}`);

      // Respond with success message
      res.status(200).json({
        message: `${selectedOption} file uploaded and saved successfully.`,
      });

    } catch (error) {
      console.error("Error handling file:", error);
      res.status(500).json({ message: "Failed to process the file." });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}

export const config = {
  api: {
    bodyParser: false, // Disable default body parser to allow Multer to handle the request
  },
};
