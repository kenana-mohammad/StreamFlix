const genreService = require("../services/genre.service");
const { successResponse } = require("../../../shared/helpers/api-response.helper");


class GenreController {

  create = async (req, res) => {
    const genre = await genreService.create(req.body);

    return successResponse(
      res,
      201,
      "Genre created successfully",
      genre
    );
  };


  getAllAdmin = async (req, res) => {
    const genres = await genreService.getAll(req.query);

    return successResponse(
      res,
      200,
      "Genres fetched successfully",
      genres
    );
  };


  getAll = async (req, res) => {
    const genres = await genreService.getAll();

    return successResponse(
      res,
      200,
      "Genres fetched successfully",
      genres
    );
  };


  getById = async (req, res) => {
    const genre = await genreService.getById(req.params.id);

    return successResponse(
      res,
      200,
      "Genre fetched successfully",
      genre
    );
  };


  update = async (req, res) => {
    const genre = await genreService.update(
      req.params.id,
      req.body
    );

    return successResponse(
      res,
      200,
      "Genre updated successfully",
      genre
    );
  };


  delete = async (req, res) => {
    await genreService.delete(req.params.id);

    return successResponse(
      res,
      200,
      "Genre deleted successfully"
    );
  };

}


module.exports = new GenreController();