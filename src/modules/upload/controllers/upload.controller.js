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

}

module.exports = new UploadController();