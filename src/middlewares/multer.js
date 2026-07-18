const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let folder = "uploads/";

        if (file.mimetype.startsWith("image/")) {
            folder += "images/";
        } else if (file.mimetype.startsWith("video/")) {
            folder += "videos/";
        } else if (file.mimetype.startsWith("application/")) {
            folder += "documents/";
        } else {
            folder += "others/";
        }

        // Create folder if it doesn't exist
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, { recursive: true });
        }

        cb(null, folder);
    },

    filename: (req, file, cb) => {
        const uniqueSuffix =
            Date.now() + "-" + Math.round(Math.random() * 1e9);

        const fileExtension = path.extname(file.originalname);

        const baseName = path.basename(
            file.originalname,
            fileExtension
        );

        const safeFileName = baseName.replace(/[^a-zA-Z0-9]/g, "_");

        cb(null, `${safeFileName}-${uniqueSuffix}${fileExtension}`);
    },
});

const fileFilter = (req, file, cb) => {
    if (
        file.mimetype.startsWith("image/") ||
        file.mimetype.startsWith("video/")
    ) {
        return cb(null, true);
    }

    cb(new Error("Only image and video files are allowed"), false);
};

const uploadLocal = multer({
    storage,
    fileFilter,
    limits: {
        files: 5,

        // Increased to support video uploads (500 MB)
        fileSize: 500 * 1024 * 1024,
    },
});

module.exports = uploadLocal;