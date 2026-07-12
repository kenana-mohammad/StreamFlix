const User = require('../../users/models/User');
const Profile = require('../../profiles/models/Profile')
const AppError = require('../../../shared/errors/AppError');


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
         if(!user) {
          throw new AppError("User not found", 404);
         }
         user.isActive = true ;
         await user.save();
         return { data: user }
      }

      static disableAccount = async (userId) => {
        const user = await User.findById(userId);
        if(!user) {
          throw new AppError("User not found", 404);
        }
        user.isActive = false;
        await user.save();
        return { data: user }
      }
}

 module.exports = DashboardUsersService;