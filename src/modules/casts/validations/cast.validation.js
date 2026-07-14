const Cast = require("../models/cast.model");

class CastService {

    async create(data) {

        return await Cast.create({
            name: data.name,
            image: data.image,
            biography: data.biography
        });

    }

    async getAll() {

        return await Cast.find().sort({ createdAt: -1 });

    }

    async getById(id) {

        return await Cast.findById(id);

    }

    async update(id, data) {

        const cast = await Cast.findById(id);

        if (!cast)
            return null;

        cast.name = data.name ?? cast.name;
        cast.image = data.image ?? cast.image;
        cast.biography = data.biography ?? cast.biography;

        await cast.save();

        return cast;

    }

    async delete(id) {

        return await Cast.findByIdAndDelete(id);

    }

    async search(name) {

        return await Cast.find({
            name: {
                $regex: name,
                $options: "i"
            }
        });

    }

}

module.exports = new CastService();
