const uploadService = require("../services/upload.service");
const { successResponse } = require("../../../shared/helpers/api-response.helper");

class UploadController {

    uploadVideo = async (req, res) => {

        const data = await uploadService.uploadVideo(req.file);

        return successResponse(
            res,
            201,
            "Video uploaded successfully",
            data
        );
    };

    uploadPoster = async (req, res) => {

        const data = await uploadService.uploadPoster(req.file);

         return successResponse(
            res,
            201,
            "Poster uploaded successfully",
            data
        );
    };

    deleteFile = async (req, res) => {

        const { public_id, resource_type } = req.body;

        const data = await uploadService.deleteFile(public_id, resource_type);

        return successResponse(
            res,
            200,
            "File deleted successfully",
            data
        );
    };

    generateSignature = async (req, res) => {

    const folder = req.body; 
    const data = await uploadService.generateSignature(folder);

    return successResponse(
        res,
        200,
        "Upload signature generated successfully",
        data
    );
};

}

module.exports = new UploadController();