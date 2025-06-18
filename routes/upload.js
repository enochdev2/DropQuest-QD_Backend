// routes/upload.js
import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

cloudinary.config({
  cloud_name: 'dg9ikhw52',
  api_key: '741795432579663',
  api_secret: 'hajeGPi0lFqi-Vg635bJJ6fTp8c'
});

const bufferToStream = (buffer) => {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
};

router.post('/', upload.single('file'), async (req, res) => {
  try {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'tether-ids' },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      bufferToStream(req.file.buffer).pipe(stream);
    });

    res.status(200).json({ url: result.secure_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to upload image" });
  }
});

export default router;
