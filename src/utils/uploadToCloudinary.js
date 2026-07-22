require("dotenv").config();
const fs = require("fs");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY_CLOUD,
    api_secret: process.env.API_SECRET_CLOUD,
});

const uploadToCloudinary = async (file) => {
    try {
        const result = await cloudinary.uploader.upload(file.path, {
            resource_type: "auto",
        });

        // Delete local file after successful upload
        fs.unlinkSync(file.path);

        return {
            url: result.secure_url,
            public_id: result.public_id,
        };

    } catch (error) {

        // Delete local file if upload failed
        if (file.path && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }

        throw error;
    }
};

module.exports = uploadToCloudinary;

// user => my server => cloudinary