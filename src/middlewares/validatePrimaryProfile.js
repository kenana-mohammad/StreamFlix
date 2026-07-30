// const Profile = require("../modules/profiles/models/Profile");
// const jwtService = require("../utils/jwtService");
// const { errorResponse } = require("../shared/helpers/api-response.helper");

// /**
//  * Middleware to strictly validate that the current request comes from a primary profile
//  * via the Profile Token (JWT) provided in the Authorization header.
//  */
// const validatePrimaryProfile = async(req, res, next) => {
//     try {
//         // 1. Extract and check the Authorization header
//         const authHeader = req.headers.authorization;

//         if (!authHeader || !authHeader.startsWith('Bearer ')) {
//             return errorResponse(res, 401, "Profile token is required!");
//         }

//         const profileToken = authHeader.split(' ')[1];

//         // 2. Verify the profile token signature and payload
//         const decodedProfile = jwtService.verifyProfileToken(profileToken);

//         // 3. Enforce that the profile must be a primary profile
//         if (!decodedProfile.primaryProfile) {
//             return errorResponse(res, 403, "Access denied. This action is restricted to the primary profile only!");
//         }

//         // 4. Attach the primary profile ID to the request object
//         req.currentProfileId = decodedProfile.profileId;
//         next();

//     } catch (error) {
//         return errorResponse(res, 403, "Invalid or expired profile token!");
//     }
// };

// module.exports = validatePrimaryProfile;
const Profile = require("../modules/profiles/models/Profile");
const User = require("../modules/users/models/User");
const jwtService = require("../utils/jwtService");
const { errorResponse } = require("../shared/helpers/api-response.helper");
const { USER_STATUS } = require("../shared/constants/user-status.constant");

/**
 * Middleware to strictly validate that the current request comes from an active 
 * user and their primary profile via the Profile Token (JWT).
 */
const validatePrimaryProfile = async (req, res, next) => {
    try {
        // 1. التأكد أن المستخدم مسجل دخول أساساً (من ميدلوير الـ auth العام)
        if (!req._user || !req._user.id) {
            return errorResponse(res, 401, "User authentication required!");
        }

        // 2. استخراج وفحص الهيدر الخاص بالـ Profile Token
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return errorResponse(res, 401, "Profile token is required!");
        }

        const profileToken = authHeader.split(' ')[1];

        const decodedProfile = jwtService.verifyProfileToken(profileToken);

        if (!decodedProfile.primaryProfile) {
            return errorResponse(res, 403, "Access denied. This action is restricted to the primary profile only!");
        }

        const userCheck = await User.findById(req._user.id);
        if (!userCheck || userCheck.status !== USER_STATUS.ACTIVE) {
            return errorResponse(res, 400, "User account is not active or does not exist!");
        }

        const profile = await Profile.findOne({
            _id: decodedProfile.profileId,
            userId: req._user.id,
            primaryProfile: true 
        });

        if (!profile) {
            return errorResponse(res, 403, "Invalid primary profile or unauthorized access!");
        }

        req.currentProfileId = profile._id;
        req.currentProfile = profile;

        next();

    } catch (error) {
        return errorResponse(res, 403, "Invalid or expired profile token!");
    }
};

module.exports = validatePrimaryProfile;