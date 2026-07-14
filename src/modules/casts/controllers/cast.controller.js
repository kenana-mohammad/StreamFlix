const { successResponse } = require("../../../shared/helpers/api-response.helper");
const CastService = require("../services/cast.service");

class CastController {
// Create Cast
 createCast = async (req, res) => {
    
    const { name , image , biography } = req.body;
    const cast = await CastService.createCast({ name, image, biography });

      return successResponse(res, 200,
        "Cast member created successfully", 
        cast)

};

// Get All Casts
 getAllCasts = async (req, res) => {

    const casts = await CastService.getAllCasts();

    return successResponse(res, 200,
        "Cast members found successfully", 
        casts
    )

};

// Get Cast By Id
 getCastById = async (req, res) => {
    const { id } = req.params;
    const cast = await CastService.getCastById(id);

    return successResponse(res, 200,
        "Cast member found successfully", 
        cast
    )

};

// Update Cast
 updateCast = async (req, res) => {
    const { id } = req.params;
    const { name , image , biography } = req.body;
    const data = { name , image , biography }
    const updateCast = await CastService.updateCast(id, data);

    return successResponse(res, 200,
        "Cast member updated successfully", 
        updateCast
    )

};

// Delete Cast
 deleteCast = async (req, res) => {
    const { id } = req.params
     await CastService.deleteCast(id);


    return successResponse(res , 200,
        "Cast member deleted successfully"
    )
   

};

// Search Cast
 searchCast = async (req, res) => {

    const name = req.query.name || "";

    const casts = await CastService.searchCast(name);

    return successResponse(res, 200,
        "Cast member search results returned successfully", 
        casts
    )

};

}

module.exports = new CastController()
