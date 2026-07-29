const Profile = require("../modules/profiles/models/Profile");
const jwtService = require("../utils/jwtService");
const { errorResponse } = require("../shared/helpers/api-response.helper");

/**
 * Middleware to strictly validate that the current request comes from a primary profile
 * via the Profile Token (JWT) provided in the Authorization header.
 */
const validatePrimaryProfile = async(req, res, next) => {
    try {
        // 1. Extract and check the Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return errorResponse(res, 401, "Profile token is required!");
        }

        const profileToken = authHeader.split(' ')[1];

        // 2. Verify the profile token signature and payload
        const decodedProfile = jwtService.verifyProfileToken(profileToken);

        // 3. Enforce that the profile must be a primary profile
        if (!decodedProfile.primaryProfile) {
            return errorResponse(res, 403, "Access denied. This action is restricted to the primary profile only!");
        }

        // 4. Attach the primary profile ID to the request object
        req.currentProfileId = decodedProfile.profileId;
        next();

    } catch (error) {
        return errorResponse(res, 403, "Invalid or expired profile token!");
    }
};

module.exports = validatePrimaryProfile;