const AppError = require("../../../shared/errors/AppError");
const validateAllowedFolders = (req, res, next) => {
    const { folder } = req.body;

    const allowedFolders = ["videos", "posters"];

    if (!folder) {
        throw new AppError("Folder is required", 400);
    }
    if (!allowedFolders.includes(folder)) {
        throw new AppError(`Invalid folder. Allowed folders are: ${allowedFolders.join(", ")}`, 400);
    }
    next();
};




const  validateFoldersWithFilesExtension = (req, res, next) => {

    const { folder, fileType } = req.body;


    const imageTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];


    const videoTypes = [
        "video/mp4",
        "video/mov",
        "video/webm"
    ];


    if (!folder || !fileType) {
        throw new AppError(
            "Folder and fileType are required",
            400
        );
    }


    if (folder === "posters") {

        if (!imageTypes.includes(fileType)) {
            throw new AppError(
                "Only image files are allowed for posters",
                400
            );
        }

    }


    if (folder === "videos") {

        if (!videoTypes.includes(fileType)) {
            throw new AppError(
                "Only video files are allowed for videos",
                400
            );
        }

    }


    next();
};

module.exports = {
    validateAllowedFolders,
    validateFoldersWithFilesExtension
}; 