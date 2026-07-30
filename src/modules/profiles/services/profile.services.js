const Profile = require("../models/Profile");
const User = require('../../users/models/User');
const passwordService = require("../../../utils/passwordService");
const {
    USER_STATUS
} = require('../../../shared/constants/user-status.constant');
const WatchHistory = require('../../watch-history/models/WatchHistory');
const Rating = require('../../ratings/models/Rating');
const Favorite = require('../../favorites/models/Favorite');
const AppError = require("../../../shared/errors/AppError");
const jwtService = require("../../../utils/jwtService");

class ProfileService {

    /**
     * Retrieve all profiles belonging to a specific user with optional name filtering.
     * Excludes the PIN field for security reasons.
     */
    getAll = async (userId, query) => {
        const filter = {
            userId
        };

        if (query) {
            filter.name = {
                $regex: query,
                $options: "i"
            };
        }

        const profiles = await Profile.find(filter).select('-pin').sort({
            createdAt: -1
        });

        return profiles;
    }

    /**
     * Create a new sub-profile for an active user.
     * Hashes the PIN if provided and returns the profile object without the PIN.
     */
    create = async (userId, data) => {
        const userCheck = await User.findById(userId);

        if (userCheck.status !== USER_STATUS.ACTIVE) {
            throw new AppError("User is not active!", 400);
        }

        let hashedPIN = null;
        if (data.pin) {
            hashedPIN = await passwordService.hash(data.pin);
        }

        const profile = await Profile.create({
            userId: userId,
            name: data.name,
            pin: hashedPIN,
            avatar: data.avatar,
            isKids: data.isKids,
            minAge: data.minAge
        });

        const profileObj = profile.toObject();
        delete profileObj.pin;
        return profileObj;
    }

    /**
     * Update an existing profile's details (name, avatar, isKids, minAge) by ID.
     */
    update = async (profileId, data) => {
        const profile = await Profile.findById(profileId);

        if (!profile) {
            throw new AppError("Profile not found!", 404);
        }

        profile.name = data.name ?? profile.name;
        profile.avatar = data.avatar ?? profile.avatar;
        profile.isKids = data.isKids ?? profile.isKids;
        profile.minAge = data.minAge ?? profile.minAge;

        await profile.save();

        const profileData = profile.toObject();
        delete profileData.pin;
        return profileData;
    }

    /**
     * Update the currently authenticated profile's details using its token ID.
     */
    updateMe
     = async (profileId, data) => {
        const profile = await Profile.findById(profileId);

        if (!profile) {
            throw new AppError("Profile not found!", 404);
        }

        profile.name = data.name ?? profile.name;
        profile.avatar = data.avatar ?? profile.avatar;
        profile.isKids = data.isKids ?? profile.isKids;
        profile.minAge = data.minAge ?? profile.minAge;

        await profile.save();

        const profileData = profile.toObject();
        delete profileData.pin;
        return profileData;
    }

    /**
     * Select a profile, enforce PIN verification rules if required, 
     * and generate a signed Profile JWT token.
     */
    select = async (profileId, pin) => {
        // 1. البحث عن البروفايل والتأكد من وجوده
        const profile = await Profile.findById(profileId);

        if (!profile) {
            throw new AppError("Profile not found!", 404);
        }

        // 2. تحديد إذا كان PIN مطلوب
        // البروفايل (رئيسي أو فرعي): PIN مطلوب فقط إذا كان محمي بـ PIN فعلاً
        const isPinRequired = Boolean(profile.pin);

        // 3. إذا PIN مطلوب، لازم يكون موجود ويطابق
        if (isPinRequired) {
            // التحقق من وجود PIN (null, undefined, أو string فاضي)
            if (pin == null || pin === "") {
                throw new AppError("PIN is required for this profile!", 400);
            }

            const isVerified = await passwordService.compare(String(pin), profile.pin);

            if (!isVerified) {
                throw new AppError("The PIN you entered is incorrect!", 400);
            }
        }

        // 4. توليد التوكن وإرجاع النتيجة
        const profileToken = jwtService.generateProfileToken({
            profileId: profile._id,
            userId: profile.userId,
            isKids: profile.isKids,
            primaryProfile: profile.primaryProfile
        });

        const profileData = profile.toObject();
        delete profileData.pin;

        return {
            profile: profileData,
            token: profileToken
        };
    };
    /**
     * Verify if the provided PIN matches a specific profile's PIN.
     */
    verifyPIN = async (profileId, pin) => {
        const profile = await Profile.findById(profileId);

        if (!profile) {
            throw new AppError("Profile not found!", 404);
        }

        if (!profile.pin) {
            throw new AppError("This profile doesn't have a PIN!", 400);
        }

        const isVerified = await passwordService.compare(pin, profile.pin);
        if (!isVerified) {
            throw new AppError("PIN is not correct!", 400);
        }
    }

    /**
     * Add a new PIN to a profile that currently doesn't have one.
     */
    addPIN = async (profileId, pin) => {
        const profile = await Profile.findById(profileId);

        if (!profile) {
            throw new AppError("Profile not found!", 404);
        }

        if (profile.pin) {
            throw new AppError("This profile already has a PIN!", 400);
        }

        const hashedPIN = await passwordService.hash(pin);
        profile.pin = hashedPIN;
        await profile.save();
    }

    /**
     * Change an existing PIN by verifying the old PIN first.
     */
    changePIN = async (profileId, oldPin, newPin) => {
        const profile = await Profile.findById(profileId);

        if (!profile) {
            throw new AppError("Profile not found!", 404);
        }

        if (!profile.pin) {
            throw new AppError("There is no old PIN! You can add a PIN instead.", 400);
        }

        const isVerified = await passwordService.compare(oldPin, profile.pin);
        if (!isVerified) {
            throw new AppError("Old PIN is not correct!", 404);
        }

        profile.pin = await passwordService.hash(newPin);
        await profile.save();
    }

    /**
     * Toggle a profile's status between ACTIVE and DEACTIVATED.
     */
    toggleStatus = async (profileId) => {
        const profile = await Profile.findById(profileId);

        if (!profile) {
            throw new AppError("Profile not found!", 404);
        }

        profile.status = profile.status === USER_STATUS.ACTIVE ?
            USER_STATUS.DEACTIVATED :
            USER_STATUS.ACTIVE;

        await profile.save();
        return profile;
    }
    /**
     * Change PIN for the currently authenticated profile using its own token.
     */
    changeMyPIN = async (profileId, oldPin, newPin) => {
        const profile = await Profile.findById(profileId).select('+pin');

        if (!profile) {
            throw new AppError("Profile not found!", 404);
        }

        // Check if the profile actually has an old PIN
        if (!profile.pin) {
            throw new AppError("This profile does not have a PIN yet! You can add one.", 400);
        }

        // Verify the old PIN
        const isVerified = await passwordService.compare(oldPin, profile.pin);
        if (!isVerified) {
            throw new AppError("Old PIN is not correct!", 404);
        }

        // Hash and save the new PIN
        profile.pin = await passwordService.hash(newPin);
        await profile.save();
    }

    /**
     * Delete a sub-profile and clean up its related data.
     * Ratings are KEPT to preserve valuable feedback for other users.
     * Prevents deleting the primary profile.
     */
    remove = async (profileId) => {
        const profile = await Profile.findById(profileId);

        if (!profile) {
            throw new AppError("Profile not found!", 404);
        }

        if (profile.primaryProfile) {
            throw new AppError("The main profile can't be deleted!", 400);
        }

        await Promise.all([
            Profile.deleteOne({
                _id: profileId
            }),
            WatchHistory.deleteMany({
                profileId
            }),
            Favorite.deleteMany({
                profileId
            }),
            // Rating.deleteMany()  التقييمات تبقى محفوظة
            // لأنها مفيدة للمستخدمين الآخرين (مثل Netflix)
        ]);
    }
}

module.exports = new ProfileService();