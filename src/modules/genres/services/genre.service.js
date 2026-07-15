const Genre = require("../models/genre");
const AppError = require("../../../shared/errors/AppError");


class GenreService {

    create = async(name, description) => {

        const existingGenre = await Genre.findOne({
            name: {
                $regex: `^${name}$`,
                $options: "i"
            },
        });

        if (existingGenre) {
            throw new AppError("Genre already exists", 400);
        }

        const genre = await Genre.create({ name, description });

        return genre;
    };


    getAll = async(query = {}) => {
        const { search } = query;

        let filter = {};

        if (search) {
            filter.name = {
                $regex: search,
                $options: "i",
            };
        }

        const genres = await Genre.find(filter);

        return genres;
    };


    getById = async(id) => {
        const genre = await Genre.findById(id);

        if (!genre) {
            throw new AppError("Genre not found", 404);
        }

        return genre;
    };


    update = async(id, data) => {
        const genre = await Genre.findById(id);

        if (!genre) {
            throw new AppError("Genre not found", 404);
        }


        if (data.name) {
            const existingGenre = await Genre.findOne({
                name: {
                    $regex: `^${data.name}$`,
                    $options: "i"
                },
                _id: { $ne: id },
            });

            if (existingGenre) {
                throw new AppError("Genre already exists", 400);
            }
        }


        genre.name = data.name || genre.name;
        genre.description = data.description || genre.description;

        await genre.save();

        return genre;
    };


    delete = async(id) => {
        const genre = await Genre.findById(id);

        if (!genre) {
            throw new AppError("Genre not found", 404);
        }

        await genre.deleteOne();

        return true;
    };

}


module.exports = new GenreService();