const User = require('../../users/models/User');
const Profile = require('../../profiles/models/Profile');
const Subscription = require('../../subscriptions/models/Subscription');
const AppError = require('../../../shared/errors/AppError');
const USER_STATUS = require('../../../shared/constants/user-status.constant');
const SUBSCRIPTION_STATUS = require('../../../shared/constants/subscription-status.constant');

class DashboardUsersService {
  static searchUser = async (query) => {
       const regex = new RegExp(query, 'i');
       const users = await User.find({
           $or: [
               { username: regex },
               { email: regex }
           ]
       })
       .select("-password")
       .sort({ createdAt: -1 });

       return { data: users };
      }
   
      static getUserInfo = async (userId) => {
          const user = await User.findById(userId).select("-password");
          if (!user) {
              throw new AppError("User not found", 404);
          }
          const profileCount = await Profile.countDocuments({ user: userId });
          const userProfiles = await Profile.find({ user: userId }).select("-userId");
          return { user, profileCount, userProfiles };
      }

      static enableAccount = async (userId) => {
         const user = await User.findById(userId);
         const subscription = await Subscription.findOne({ user: userId });
         if (!user) {
             throw new AppError("User not found", 404);
         }
         user.status = USER_STATUS.ACTIVE;
         await user.save();

         if (subscription) {
             subscription.status = SUBSCRIPTION_STATUS.ACTIVE;
             await subscription.save();
         }

         return { data: user  , subscription: subscription }
      }

      static disableAccount = async (userId) => {
        const user = await User.findById(userId);
        const subscription = await Subscription.findOne({ user: userId });
        if (!user) {
            throw new AppError("User not found", 404);
        }
        user.status = USER_STATUS.INACTIVE;
        await user.save();
         if (subscription) {
             subscription.status = SUBSCRIPTION_STATUS.INACTIVE;
             await subscription.save();
         }
        return { data: user , subscription: subscription }
      }
}

 module.exports = DashboardUsersService;