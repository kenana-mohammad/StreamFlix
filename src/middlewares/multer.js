const multer = require("multer");
const path = require("path");
const fs = require("fs");

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
const VIDEO_EXTENSIONS = [".mp4", ".mov", ".avi", ".mkv", ".webm"];

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

const imageFileFilter = (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    if (
        file.mimetype.startsWith("image/") &&
        IMAGE_EXTENSIONS.includes(extension)
    ) {
        return cb(null, true);
    }

    cb(
        new Error(
            "Only JPG, JPEG, PNG and WEBP image files are allowed"
        ),
        false
    );
};

const videoFileFilter = (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    if (
        file.mimetype.startsWith("video/") &&
        VIDEO_EXTENSIONS.includes(extension)
    ) {
        return cb(null, true);
    }

    cb(
        new Error(
            "Only MP4, MOV, AVI, MKV and WEBM video files are allowed"
        ),
        false
    );
};

const imageUpload = multer({
    storage,
    fileFilter: imageFileFilter,
    limits: {
        files: 5,
        fileSize: 200 * 1024 * 1024,// 200MB
    },
});

const videoUpload = multer({
    storage,
    fileFilter: videoFileFilter,
    limits: {
        files: 5,
        fileSize: 2000 * 1024 * 1024,// 2GB
    },
});

module.exports = {
    imageUpload,
    videoUpload,
};
