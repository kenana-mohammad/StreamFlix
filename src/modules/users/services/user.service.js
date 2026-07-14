const User = require("../models/User");

class UserService {
    // async getAll() {}

    // async getById(id) {}

    // async create(data) {}

    // async update(id, data) {}

    // async remove(id) {}
    getMyProfile = async (userId) => {
        const user = await User.findById(userId)
            .select("-password");

        if (!user) {

            const error = new Error("المستخدم غير موجود")
            error.statusCode = 404;
            throw error;

        }
        return user

    }
    updateMyProfile = async (userId, name, phone) => {
        let user = await User.findById(userId);


        if (!user) {
            const error = new Error("المستخدم غير موجود")
            error.statusCode = 404;
            throw error;

        }


        user.name = name || user.name;
        user.phone = phone || user.phone;


        await user.save();


        const userData = user.toObject();
        delete userData.password;
        return userData
    }
}

module.exports = new UserService();