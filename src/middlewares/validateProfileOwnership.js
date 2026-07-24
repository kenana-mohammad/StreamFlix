const Profile = require('../modules/profiles/models/Profile')
const User = require('../modules/users/models/User')
const { errorResponse } = require("../../src/shared/helpers/api-response.helper");
const {USER_STATUS } = require('../../src/shared/constants/user-status.constant');

const validateProfileOwnership = async (req, res, next) => {
  const id =  req.params.id;
  const userId = req._user.id;
  
  const userCheck = await User.findById(userId)
  const profile = await Profile.findOne({
    _id: id,
    userId: userId
  });

    if(userCheck.status != USER_STATUS.ACTIVE) {
        return errorResponse(res, 400,
          "User Account is not active"
        )
  }

  if (!profile) {
    return res.status(403).json({
      success: false,
      message: "Invalid profile or unauthorized",
    });
  }

  next();
};

module.exports = validateProfileOwnership;