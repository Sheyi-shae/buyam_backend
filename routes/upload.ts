import { Router } from 'express';
import upload from '../middleware/multer.js';
import { authMiddleware, requireAdmin } from '../middleware/auth-middleware.js';
import { NextFunction, Request, Response } from 'express';

// Define your own file type interface
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

type UploadedFile = MulterFile & {
  path?: string;
};

const uploadRouter = Router();

uploadRouter.post("/", requireAdmin, upload.single("file"), (
  req: Request, res: Response, next: NextFunction) => {
    console.log("File upload endpoint hit")
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const file = req.file as UploadedFile;

      res.status(200).json({
        success: true,
        message: "File uploaded successfully",
        url: file.path,
      });
    } catch (error) {
      console.error("File upload error:", error);
      res.status(500).json({ error: "File upload failed" });
    }
});

uploadRouter.post("/public", authMiddleware, upload.single("file"), (
  req: Request, res: Response, next: NextFunction) => {
    console.log("File upload endpoint hit")
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const file = req.file as UploadedFile;

      res.status(200).json({
        success: true,
        message: "File uploaded successfully",
        url: file.path,
      });
    } catch (error) {
      console.error("File upload error:", error);
      res.status(500).json({ error: "File upload failed" });
    }
});

export default uploadRouter;