const User = require('../../users/models/User');
const Profile = require('../../profiles/models/Profile');
const Subscription = require('../../subscriptions/models/Subscription');
const AppError = require('../../../shared/errors/AppError');
const {USER_STATUS} = require('../../../shared/constants/user-status.constant');
const {SUBSCRIPTION_STATUS} = require('../../../shared/constants/subscription-status.constant');
const {ROLES} = require('../../../shared/constants/roles.constant');

class DashboardUsersService {
  static searchUser = async (query) => {
       const regex = new RegExp(query, 'i');
       const users = await User.find({
           $or: [
               { username: regex },
               { email: regex }
           ]
       })
       .sort({ createdAt: -1 });

       return users;
      }
   
      static getUserInfo = async (userId) => {
          const userInfo = await User.findById(userId);
          if (!userInfo) {
              throw new AppError("User not found", 404);
          }
          const profileCount = await Profile.countDocuments({ user: userId });
          const userProfiles = await Profile.find({ user: userId }).select("-userId");
          return { userInfo, profileCount, userProfiles };
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

         return  { userEnabled: user, subscription : subscription } 
      }

      static disableAccount = async (userId) => {
        const user = await User.findById(userId);
        const subscription = await Subscription.findOne({ user: userId });
        if (!user) {
            throw new AppError("User not found", 404);
        }
        user.status = USER_STATUS.DEACTIVATED;
        await user.save();
         if (subscription) {
             subscription.status = SUBSCRIPTION_STATUS.CANCELLED;
             await subscription.save();
         }
        return  { userDisabled: user, subscription} 
      }

      static createContentManager = async ( name , email , password , phone) => {
        const user = await User.create({
          name : name,
          email: email,
          password: password,
          role: ROLES.CONTENT_MANAGER,
          phone : phone,
        });
     
        return { data: user  }
      }


}

module.exports = DashboardUsersService;