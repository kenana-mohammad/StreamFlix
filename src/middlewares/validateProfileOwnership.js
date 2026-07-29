const Profile = require('../modules/profiles/models/Profile')
const User = require('../modules/users/models/User')
const { errorResponse } = require("../../src/shared/helpers/api-response.helper");
const { USER_STATUS } = require('../../src/shared/constants/user-status.constant');

/**
 * Middleware to validate that the requested profile belongs to the authenticated user 
 * and that the user's account is active.
 */
const validateProfileOwnership = async(req, res, next) => {
    try {
        const id = req.params.id;
        const userId = req._user.id;

        // 1. Check if the user account is active
        const userCheck = await User.findById(userId);
        if (!userCheck || userCheck.status !== USER_STATUS.ACTIVE) {
            return errorResponse(res, 400, "User Account is not active");
        }

        // 2. Check if the profile exists and belongs to this user
        const profile = await Profile.findOne({
            _id: id,
            userId: userId
        });

        if (!profile) {
            return errorResponse(res, 403, "Invalid profile or unauthorized access");
        }

        next();
    } catch (error) {
        return errorResponse(res, 500, "Internal server error during profile validation");
    }
};

module.exports = validateProfileOwnership;