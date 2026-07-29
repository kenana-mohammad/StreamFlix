const {
    USER_STATUS
} = require("../../../shared/constants/user-status.constant");
const jwtService = require("../../../utils/jwtService");
const passwordService = require("../../../utils/passwordService");
const Device = require("../../devices/models/Device");
const Profile = require("../../profiles/models/Profile");
const User = require("../../users/models/User");
const useTransaction = process.env.USE_TRANSACTIONS === 'true';


class AuthService {
    handleFailedLogin = async(user) => {
            user.failedLoginAttempts = +(user.failedLoginAttempts || 0) + 1
            if (user.failedLoginAttempts >= 5) {
                user.status = USER_STATUS.BANNED;
                user.lockUntil = new Date(Date.now() + (30 * 60 * 1000))
            }
            await user.save();
        }
        //============
        //reset 
    resetFailedLoginAttempt = async(user) => {
        user.status = USER_STATUS.ACTIVE;
        user.lockUntil = null;
        user.failedLoginAttempts = 0;
        await user.save();
    }
    async register(data) {

        const session = useTransaction ? await mongoose.startSession() : null;
        if (session) session.startTransaction();
        try {
            const hashed = await passwordService.hash(data.password);

            let user = await User.create([{
                name: data.name,
                email: data.email,
                phone: data.phone,
                password: hashed
            }], { session });

            const newUser = user[0];

            const profile = await Profile.create([{
                userId: newUser._id,
                name: newUser.name,
                primaryProfile: true,
                avatar: data.avatar || "default-avatar.png",
                pin: null
            }], { session });

            const newProfile = profile[0];

            if (session) await session.commitTransaction();
            if (session) session.endSession();

            const userObj = newUser.toObject();
            delete userObj.password;

            const profileObj = newProfile.toObject();
            delete profileObj.pin;

            return { user: userObj, profile: profileObj };

        } catch (error) {
            if (session) await session.abortTransaction();
            if (session) session.endSession();
            throw error;
        }
    }
    async login(email, password) {

        let user = await User.findOne({
            email: email
        }).select('+password');
        if (!user) {

            const error = new Error("البيانات خاطئة");
            error.statusCode = 404;
            throw error;
        } else {
            if (user.status === USER_STATUS.BANNED) {
                if (user.lockUntil <= new Date()) {
                    await this.resetFailedLoginAttempt(user);

                } else {
                    const error = new Error('لا يمكن تسجيل الدخول يرجى المحاولة لاحقا');
                    error.statusCode = 400;
                    throw error;

                }

            }
        }
        const isVerified = await passwordService.compare(password, user.password);
        if (!isVerified) {
            const error = new Error("البيانات خاطئة");
            await this.handleFailedLogin(user)

            error.statusCode = 404;
            throw error;
        }
        await this.resetFailedLoginAttempt(user);


        // تحديث وقت آخر دخول
        user.lastLogin = new Date();
        await user.save();
        return user;
    }
    async logout(req) {
        cookiesService.clearTokens(res);

    }
    async refreshAuthTokens(refreshToken) {
            if (!refreshToken) throw {
                statusCode: 401,
                message: "يجب تسجيل الدخول"
            };

            const decoded = jwtService.verifyRefreshToken(refreshToken);
            const data = {
                id: decoded.id,
                email: decoded.email,
                role: decoded.role,
                deviceId: decoded.deviceId

            };

            const accessToken = jwtService.genrateAccessToken(data);
            const newRefreshToken = jwtService.genrateRefreshToken(data);

            return {
                accessToken,
                newRefreshToken
            };
        }
        //==============
    async changePassword(userId, oldPassword, newPassword) {
        const user = await User.findById(userId).select("+password");
        if (!user) throw {
            statusCode: 404,
            message: "المستخدم غير موجود"
        };

        const isMatch = await passwordService.compare(oldPassword, user.password);
        if (!isMatch) {
            // الـ asyncHandler سيلتقط هذا الخطأ
            throw {
                statusCode: 400,
                message: "كلمة المرور القديمة غير صحيحة"
            };
        }

        user.password = await passwordService.hash(newPassword);
        await user.save();
        await Device.deleteMany({ userId: userId });
    }
}

module.exports = new AuthService();