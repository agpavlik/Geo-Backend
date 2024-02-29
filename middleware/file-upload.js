// Multer helps work with multipart form data. Special thing about this data format is
// that it can contain a mixture of normal text data and file data or binary data.
// JSON can only work with text data. Binary data is different and JSON format can't deal with binary data.
// So we need a specific type of request body we can submit to the back end.
// https://github.com/expressjs/multer
const multer = require("multer");

// Generate a random unique file name
const uuid = require("uuid");

// Mime types tell which kind of file we are dealing with.
const MIME_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
};

const fileUpload = multer({
  // Limit for file in bytes
  limits: 500000,
  storage: multer.diskStorage({
    // Control the destination where files get stored
    destination: (req, file, cb) => {
      // Describes the path where store file
      cb(null, "uploads/images");
    },
    // Control the file name
    filename: (req, file, cb) => {
      const ext = MIME_TYPE_MAP[file.mimetype];
      // Generates a random file name with the right extension.
      cb(null, uuid.v1() + "." + ext);
    },
  }),
  // File validation
  fileFilter: (req, file, cb) => {
    const isValid = !!MIME_TYPE_MAP[file.mimetype];
    let error = isValid ? null : new Error("Invalid mime type!");
    cb(error, isValid);
  },
});

module.exports = fileUpload;
