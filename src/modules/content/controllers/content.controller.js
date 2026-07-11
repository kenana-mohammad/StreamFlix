const contentService = require('../services/content.service');
const { successResponse } = require('../../../shared/helpers/api-response.helper');
const asyncHandler = require('../../../utils/asyncHandler');

class ContentController {
    getAllForAdmin = asyncHandler(async (req, res) => {
        const contents = await contentService.getAllContent(true, req.query);
        return successResponse(res, 200, 'All content fetched successfully for admin', contents);
    });

    getByIdForAdmin = asyncHandler(async (req, res) => {
        const content = await contentService.getContentById(req.params.id, true);
        return successResponse(res, 200, 'Content details fetched successfully for admin', content);
    });

    getAllForClient = asyncHandler(async (req, res) => {
        const contents = await contentService.getAllContent(false, req.query);
        return successResponse(res, 200, 'Available content fetched successfully', contents);
    });

    getByIdForClient = asyncHandler(async (req, res) => {
        const content = await contentService.getContentById(req.params.id, false);
        return successResponse(res, 200, 'Content details fetched successfully', content);
    });
}

module.exports = new ContentController();