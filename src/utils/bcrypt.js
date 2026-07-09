//
const bcrypt = require('bcryptjs')
class PasswordService {
    async hash(password) {
        return await bcrypt.hash(password, 12)


    }

    async compare(password, hashed) {
        return await bcrypt.compare(password, hashed)


    }
}
module.exports = new PasswordService()