const jwtService = require("../utils/jwtService");
const Profile = require("../modules/profiles/models/Profile");
const { errorResponse } = require("../shared/helpers/api-response.helper");

/**
 * Middleware to validate the Profile Token (JWT) and ensure it belongs to the authenticated user.
 * This provides double security: both user token and profile token must be valid and match.
 */
const validateProfileToken = async(req, res, next) => {
    try {
        if (!req._user || !req._user.id) {
            return errorResponse(res, 401, "User authentication required!");
        }

        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return errorResponse(res, 401, "Profile token is required!");
        }

        const profileToken = authHeader.split(' ')[1];
        const decodedProfile = jwtService.verifyProfileToken(profileToken);

        const profile = await Profile.findOne({
            _id: decodedProfile.profileId,
            userId: req._user.id
        });

        if (!profile) {
            return errorResponse(res, 403, "This profile does not belong to you!");
        }

        req.currentProfileId = decodedProfile.profileId;
        req.currentProfile = profile; 

        next();
    } catch (error) {
        return errorResponse(res, 403, "Invalid or expired profile token!");
    }
};

module.exports = validateProfileToken;