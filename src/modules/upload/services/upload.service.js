const uploadToCloudinary = require("../../../utils/uploadToCloudinary");
const AppError = require("../../../shared/errors/AppError");

class UploadService {

    uploadVideo = async (file) => {

        if (!file) {
            throw new AppError("Video file is required", 400);
        }

        const result = await uploadToCloudinary(file);

        return result;
    };

    uploadPoster = async (file) => {

        if (!file) {
            throw new AppError("Poster image is required", 400);
        }

        const result = await uploadToCloudinary(file);

        return result;
    };

}

module.exports = new UploadService();