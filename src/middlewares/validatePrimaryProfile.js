const AppError = require("../shared/errors/AppError");

const validatePrimaryProfile = async(req, res, next) => {
    try {

        const profile = req.activeProfile;

        if (!profile.primaryProfile) {
            throw new AppError(
                "Only primary profile can access this resource",
                403
            );
        }

        next();

    } catch (error) {
        next(error);
    }
};

module.exports = validatePrimaryProfile;