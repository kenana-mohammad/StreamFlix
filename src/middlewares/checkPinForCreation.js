const Profile = require("../modules/profiles/models/Profile");
const { errorResponse } = require("../shared/helpers/api-response.helper");

/**
 * Middleware to check if the primary profile has a PIN set before allowing 
 * the creation of new sub-profiles. If no PIN exists, it blocks the request.
 */
const checkPinForCreation = async(req, res, next) => {
    try {
        // Retrieve the profile ID attached from the previous middleware (e.g., validatePrimaryProfile)
        const profileId = req.currentProfileId;

        if (!profileId) {
            return errorResponse(res, 401, "Unauthorized. Please log in first.");
        }

        // Find the profile to check whether a PIN has been set
        const profile = await Profile.findById(profileId);

        if (!profile) {
            return errorResponse(res, 404, "Profile not found.");
        }

        // Enforce the requirement: If the primary profile does not have a PIN, block creation
        if (!profile.pin) {
            return errorResponse(res, 403, "You must set a PIN for your primary profile before creating new profiles.");
        }

        next();
    } catch (error) {
        next(error);
    }
};

module.exports = checkPinForCreation;