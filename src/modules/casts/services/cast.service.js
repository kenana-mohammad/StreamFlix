const Cast = require("../models/cast.model");
const AppError = require("../../../shared/errors/AppError");

class CastService {

 createCast = async ({name , image , biography}) => {
  const castCheck = await Cast.findOne({name})
  if (castCheck) {
    throw new AppError("Cast member Already added" , 400)
  }
  return await Cast.create({name , image , biography });
};

 getAllCasts = async () => {
  return await Cast.find().sort({ createdAt: -1 });
};

 getCastById = async (id) => {
  const cast = await Cast.findById(id);
  if (!cast) {
    throw new AppError("Cast mamber was not found" , 404)
  }
  return await Cast.findById(id);
};

 updateCast = async (id, data) => {
    const cast = await Cast.findById(id);
  if (!cast) {
    throw new AppError("Cast mamber was not found" , 404)
  }

    if (data.name) {
          const existingCast = await Cast.findOne({
              name: {
                  $regex: `^${data.name}$`,
                  $options: "i"
              },
          });

          if (existingCast) {
              throw new AppError("Cast member already exists", 400);
          }
      }
  return await Cast.findByIdAndUpdate(id, data, {
    new: true,
  });
};

 deleteCast = async (id) => {
  const cast = await Cast.findById(id);

  if (!cast) {
    throw new AppError("Cast member not found" , 404)
  }
  return await Cast.findByIdAndDelete(id);
};

 searchCast = async (name) => {
  const searchResults = await Cast.find({
    name: {
      $regex: name,
      $options: "i",
    },
  });
  return searchResults;
};


}

module.exports = new CastService()