const Subscription = require('../models/Subscription');

const checkActiveSubscription = async(req, res, next) => {
    try {
        // افترضنا أن الـ verifyToken يضع بيانات المستخدم في req.user أو req.userId
        const userId = req._user.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated"
            });
        }

        const activeSubscription = await Subscription.findOne({
            userId: userId,
            status: 'active',
            endDate: { $gt: new Date() }
        });

        if (!activeSubscription) {
            return res.status(403).json({
                success: false,
                message: "Access denied: You do not have an active subscription or your subscription has expired."
            });
        }

        req.subscription = activeSubscription;

        next();
    } catch (error) {
        console.error('[Check Subscription Middleware Error]:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error during subscription verification",
            error: error.message
        });
    }
};

module.exports = {
    checkActiveSubscription
};