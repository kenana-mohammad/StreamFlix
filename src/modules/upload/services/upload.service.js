const cloudinary = require("cloudinary").v2;
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
    };

    generateSignature = async (folder) => {
    const timestamp = Math.round(Date.now() / 1000);

    const signature = cloudinary.utils.api_sign_request(
        { 
            timestamp ,
            folder
        },
        process.env.API_SECRET_CLOUD
    );

    return {
        timestamp,
        signature,
        cloudName: process.env.CLOUD_NAME,
        apiKey: process.env.API_KEY_CLOUD,
    };
};

}

module.exports = new UploadService();