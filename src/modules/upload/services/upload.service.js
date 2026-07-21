const uploadToCloudinary = require("../../../utils/uploadToCloudinary");
const deleteFromCloudinary = require("../../../utils/deleteFromCloudinary");
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

    deleteFile = async (public_id,resource_type) => {

        if (!public_id) {
            throw new AppError("Public ID is required", 400);
        }
        if(!["video", "image"].includes(resource_type) )
            {
            throw new AppError("Invalid resource type", 400);
        };

        const result = await deleteFromCloudinary(public_id, resource_type);

        return result;
    }   

}

module.exports = new UploadService();