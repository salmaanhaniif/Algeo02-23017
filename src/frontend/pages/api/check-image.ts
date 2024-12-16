import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { imageName } = req.query;
  
  if (typeof imageName !== 'string') {
    return res.status(400).json({ exists: false, message: 'Image name is required.' });
  }

  // Define the path to the images directory
  const imageDirectory = path.join(process.cwd(), 'public', 'uploads', 'images');
  const imagePath = path.join(imageDirectory, imageName);

  // Check if the file exists
  try {
    const exists = fs.existsSync(imagePath);
    return res.status(200).json({ exists });
  } catch (error) {
    console.error('Error checking image existence:', error);
    return res.status(500).json({ exists: false, message: 'Error checking image existence.' });
  }
}
