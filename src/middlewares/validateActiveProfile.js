const Profile = require("../modules/profiles/models/Profile");
const AppError = require("../shared/errors/AppError");

;

const validateActiveProfile = async(req, res, next) => {
    try {
        const profileId = req.headers['x-profile-id'];

        if (!profileId) {
            return next(new AppError("Active profile is required! Please select a profile first.", 400));
        }

        const userId = req._user.id;

        const profile = await Profile.findOne({
            _id: profileId,
            userId: userId
        });

        if (!profile) {
            return next(new AppError("Invalid profile or unauthorized access.", 403));
        }

        req.activeProfile = profile;

        next();
    } catch (error) {
        next(error);
    }
};

module.exports = validateActiveProfile