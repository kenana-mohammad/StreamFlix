const Profile = require('../models/Profile')
const User = require('../../users/models/User');
const AppError = require('../../../shared/errors/AppError');

class ProfileController {

     create = async (req, res) => {
        const { id } = req.params
        const { name , pin, avatar , isKids , minAge} = req.body
        const userCheck = await User.findById({id});
        if(!userCheck) {
            throw new AppError("User does not exist!" , 404)
        }
        


     };
}

module.exports = new ProfileController();