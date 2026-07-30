const Subscription = require('../modules/subscriptions/models/Subscription');
const AppError = require('../shared/errors/AppError');

const checkActiveSubscription = async(req, res, next) => {
    try {
        const userId = req._user.id;

        if (!userId) {
            return next(
                new AppError(
                    'Unauthorized: User not authenticated',
                    401
                )
            );
        }

        const activeSubscription = await Subscription.findOne({
            userId,
            status: 'active',
            startDate: { $lte: new Date() },
            endDate: { $gt: new Date() }
        });

        if (!activeSubscription) {
            return next(
                new AppError(
                    'You do not have an active subscription or your subscription has expired.',
                    403
                )
            );
        }

        req.subscription = activeSubscription;

        next();

    } catch (error) {
        next(error);
    }
};

module.exports = {
    checkActiveSubscription
};