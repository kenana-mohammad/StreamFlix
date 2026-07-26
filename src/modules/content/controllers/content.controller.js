const contentService = require('../services/content.service');
const { successResponse } = require('../../../shared/helpers/api-response.helper');
const { CONTENT_TYPE } = require('../../../shared/constants/content-type.constant');
const AppError = require('../../../shared/errors/AppError');

class ContentController {

    validateType = (type) => {
        if (type && !Object.values(CONTENT_TYPE).includes(type)) {
            throw new AppError(`Invalid type. Must be one of: ${Object.values(CONTENT_TYPE).join(', ')}`, 400);
        }
    };

    getAllForAdmin = async (req, res) => {
        const { type } = req.query;
        this.validateType(type);
        const queryOptions = type ? { type } : {};
        const contents = await contentService.getAllContent(true, queryOptions);

        return successResponse(
            res,
            200,
            'All content fetched successfully for admin',
            contents
        );
    };

    getByIdForAdmin = async (req, res) => {
        const { id } = req.params;
        const content = await contentService.getContentById(id, true);

        return successResponse(
            res,
            200,
            'Content details fetched successfully for admin',
            content
        );
    };

    getAllForClient = async (req, res) => {
        const { type } = req.query;
        this.validateType(type);
        const queryOptions = type ? { type } : {};
        const contents = await contentService.getAllContent(false, queryOptions);

        return successResponse(
            res,
            200,
            'Available content fetched successfully',
            contents
        );
    };

    getByIdForClient = async (req, res) => {
        const { id } = req.params;
        const content = await contentService.getContentById(id, false);

        return successResponse(
            res,
            200,
            'Content details fetched successfully',
            content
        );
    };


   
    // Top Rated Content
   
    getTopRated = async (req, res) => {
        const contents = await contentService.getTopRated();

        return successResponse(
            res,
            200,
            'Top rated content fetched successfully',
            contents
        );
    };

}

module.exports = new ContentController();