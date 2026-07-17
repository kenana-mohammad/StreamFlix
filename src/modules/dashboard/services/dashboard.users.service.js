const User = require('../../users/models/User');
const Profile = require('../../profiles/models/Profile');
const Subscription = require('../../subscriptions/models/Subscription');
const AppError = require('../../../shared/errors/AppError');
const { USER_STATUS } = require('../../../shared/constants/user-status.constant');
const { SUBSCRIPTION_STATUS } = require('../../../shared/constants/subscription-status.constant');
const { ROLES } = require('../../../shared/constants/roles.constant');

class DashboardUsersService {
    getUsers = async(query) => {
        if (!query) return await User.find().sort({ createdAt: -1 });

        const regex = new RegExp(query, 'i');

        return await User.find({
                $or: [
                    { name: { $regex: regex } },
                ]
            })
            .sort({ createdAt: -1 })
    }

    getUserInfo = async(userId) => {
        const userInfo = await User.findById(userId);
        if (!userInfo) {
            throw new AppError("User not found", 404);
        }
        const profileCount = await Profile.countDocuments({ user: userId });
        const userProfiles = await Profile.find({ user: userId }).select("-userId");
        return { userInfo, profileCount, userProfiles };
    }
    updateAccountStatus = async(userId, newStatus) => {
        const user = await User.findById(userId);
        if (!user) throw new AppError("User not found", 404);

        const subscription = await Subscription.findOne({ user: userId });

        if (newStatus === 'active') {
            user.status = USER_STATUS.ACTIVE;

            if (subscription) {
                if (subscription.endDate > new Date()) {
                    subscription.status = SUBSCRIPTION_STATUS.ACTIVE;
                } else {
                    subscription.status = SUBSCRIPTION_STATUS.EXPIRED;
                }
                await subscription.save();
            }
        } else {
            user.status = USER_STATUS.DEACTIVATED;
            if (subscription) {
                subscription.status = SUBSCRIPTION_STATUS.CANCELLED;
                await subscription.save();
            }
        }

        await user.save();
        return { user, subscription };
    }
    createContentManager = async(name, email, password, phone) => {
        const user = await User.create({
            name: name,
            email: email,
            password: password,
            role: ROLES.CONTENT_MANAGER,
            phone: phone,
        });

        return { data: user }
    }


}

module.exports = new DashboardUsersService();