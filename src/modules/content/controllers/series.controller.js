const seriesService = require('../services/series.service');
const { successResponse } = require('../../../shared/helpers/api-response.helper');

class SeriesController {
    create = async(req, res) => {
        const { title, description, poster, ageRating, trailerUrl, releaseYear, status, publishAt, totalSeasons, genres, casts } = req.body;
        const data = { title, description, poster, ageRating, trailerUrl, releaseYear, status, publishAt, totalSeasons, genres, casts };
        const { seriesId } = req.params;
        const result = await seriesService.createSeries(data);
        return successResponse(res, 201, 'Series created successfully', result);
    };

    getAllForAdmin = async(req, res) => {
        const series = await seriesService.getSeries(true);
        return successResponse(res, 200, 'All series fetched successfully', series);
    };

    getByIdForAdmin = async(req, res) => {
        const { id } = req.params;
        const series = await seriesService.getSeriesById(id, true);
        return successResponse(res, 200, 'Series details fetched successfully', series);
    };

    getAllForClient = async(req, res) => {
        const series = await seriesService.getSeries(false);
        return successResponse(res, 200, 'Available series fetched successfully', series);
    };

    getByIdForClient = async(req, res) => {
        const { id } = req.params;
        const series = await seriesService.getSeriesById(id, false);
        return successResponse(res, 200, 'Series details fetched successfully', series);
    };

    update = async(req, res) => {
        const { id } = req.params;
        const { title, description, poster, ageRating, trailerUrl, releaseYear, status, publishAt, totalSeasons, genres, casts } = req.body;
        const data = { title, description, poster, ageRating, trailerUrl, releaseYear, status, publishAt, totalSeasons, genres, casts };

        const series = await seriesService.updateSeries(id, data);
        return successResponse(res, 200, 'Series updated successfully', series);
    };

    changeStatus = async(req, res) => {
        const { id } = req.params;
        const { status } = req.body;

        const series = await seriesService.changeStatus(id, status);
        return successResponse(res, 200, 'Series status updated successfully', series);
    };

    delete = async(req, res) => {
        const { id } = req.params;
        await seriesService.deleteSeries(id);
        return successResponse(res, 200, 'Series deleted successfully', null);
    };
}

module.exports = new SeriesController();