const Cast = require("../models/cast.model");

const createCast = async (data) => {
  return await Cast.create(data);
};

const getAllCasts = async () => {
  return await Cast.find();
};

const getCastById = async (id) => {
  return await Cast.findById(id);
};

const updateCast = async (id, data) => {
  return await Cast.findByIdAndUpdate(id, data, {
    new: true,
  });
};

const deleteCast = async (id) => {
  return await Cast.findByIdAndDelete(id);
};

const searchCast = async (name) => {
  return await Cast.find({
    name: {
      $regex: name,
      $options: "i",
    },
  });
};

module.exports = {
  createCast,
  getAllCasts,
  getCastById,
  updateCast,
  deleteCast,
  searchCast,
};