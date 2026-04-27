const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif'];
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

// File filter – validates type before accepting
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const isAllowedMime = ALLOWED_MIME_TYPES.includes(file.mimetype);
  const isAllowedExt = ALLOWED_EXTENSIONS.includes(ext);

  if (isAllowedMime && isAllowedExt) {
    cb(null, true);
  } else {
    cb(
      new multer.MulterError(
        'LIMIT_UNEXPECTED_FILE',
        `Only JPG, JPEG, PNG, and GIF files are allowed. Received: ${file.originalname}`
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
});

// Multer error handler middleware
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: `File too large. Maximum allowed size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`,
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: err.field || 'Invalid file type. Only JPG, PNG, GIF are allowed.',
      });
    }
    return res.status(400).json({ success: false, message: err.message });
  }
  next(err);
};

module.exports = { upload, handleUploadError };
