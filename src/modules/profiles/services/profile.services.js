const Profile = require("../models/Profile")
const User = require('../../users/models/User');
const passwordService = require("../../../utils/passwordService");
const {USER_STATUS } = require('../../../shared/constants/user-status.constant');
const WatchHistory = require('../../watch-history/models/WatchHistory');
const Rating = require('../../ratings/models/Rating');
const Favorite = require('../../favorites/models/Favorite');
const AppError = require("../../../shared/errors/AppError");


class ProfileService {
    getAll = async (userId , query) => {
          const filter = { userId };
        
            if (query) {
              filter.name = { $regex: query, $options: "i" };
            }  
             
          const profiles = await Profile.find(filter).select('-pin').sort({ createdAt: -1 });
          
          return profiles
             
    }

    create = async (userId, data) => {

         const userCheck = await User.findById(userId);
         
          if(userCheck.status != USER_STATUS.ACTIVE) {
              throw new AppError("User is not active!" , 400)
          }
          let hashedPIN = null;
          if (data.pin) {
            hashedPIN = await passwordService.hash(data.pin);
         }
              
          const profile = await Profile.create({
              userId : userId,
              name : data.name,
              pin: hashedPIN ,
              avatar : data.avatar,
              isKids : data.isKids,
              minAge : data.minAge
          })
           const profileObj = profile.toObject();
           delete profileObj.pin;
          return profileObj
    }

    update = async (profileId ,data) => {
    
      const profile = await Profile.findById(profileId)
              
        profile.name = data.name || profile.name;
        profile.avatar = data.avatar || profile.avatar;
        profile.isKids = data.isKids || profile.isKids;
        profile.minAge = data.minAge || profile.minAge;
             
       await profile.save();
  
        const profileData = profile.toObject();
        delete profileData.pin;
        return profileData
             
    }

    select = async (profileId, pin) => {
         const profile = await Profile.findById(profileId);

        if (profile.pin){
            const isVerified = await passwordService.compare(pin, profile.pin)
            if (!isVerified) {
            throw new AppError("PIN is not correct!", 404)
          }
        else {
           const profileData = profile.toObject();
           delete profileData.pin;
           return profileData
        }
      }
      else {
       return profile
      }
    }

    verifyPIN = async (profileId , pin) => {
        const profile = await Profile.findById(profileId);
        
        const isVerified = await passwordService.compare(pin, profile.pin)
        if (!isVerified) {
          throw new AppError("PIN is not correct!" , 400)
        }
   
    }

    addPIN = async (profileId , pin) => {
       const profile = await Profile.findById(profileId);
       const  hashedPIN = await passwordService.hash(pin);

       profile.pin= hashedPIN;
       profile.save();
  

    }

    changePIN = async (profileId, oldPin , newPin) => {
        const profile = await Profile.findById(profileId);
    
          const isVerified = await passwordService.compare(oldPin, profile.pin)
          if (!isVerified) {
             throw new AppError("Old PIN is not correct!" , 404)
           }

          profile.pin = await passwordService.hash(newPin);
          profile.save();
         
        }

    

    delete = async (profileId) => {
      
        await Promise.all([
            Profile.deleteOne({ _id :profileId }),
            WatchHistory.deleteMany({ profileId }),
            Favorite.deleteMany({ profileId }),
            Rating.deleteMany({ profileId }),
        ])

    }
}

module.exports = new ProfileService()