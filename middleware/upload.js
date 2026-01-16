import multer from "multer";

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 40 * 1024 * 1024, // 40MB per file
    fieldSize: 10 * 1024 * 1024, // 10MB for text fields (handles large base64 strings)
    fields: 50, // Max number of non-file fields
    files: 10 // Max number of file uploads
  }
});

export default upload;
