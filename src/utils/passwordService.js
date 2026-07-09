// //
// const bcrypt = require('bcryptjs')
// class PasswordService {
//     async hash(password) {
//         return await bcrypt.hash(password, 12)


//     }

//     async compare(password, hashed) {
//         return await bcrypt.compare(password, hashed)


//     }
// }
// module.exports = new PasswordService()
//argon2
const argon2 = require('argon2');
class PasswordService {
    async hash(password) {
            try {
                return await argon2.hash(password, {
                    type: argon2.argon2id,
                    memoryCost: 2 ** 16, // 64MB
                    timeCost: 3,
                    parallelism: 1,
                    hashLength: 32
                })

            } catch (error) {
                throw new Error("Error hashing password: argon2 " + error.message);
            }
        }
        ///erify
    async compare(password, hashed) {
        try {
            return await argon2.verify(hashed, password);
        } catch (error) {
            throw new Error("Error verify password: argon2 " + error.message);
        }
    }
}
module.exports = new PasswordService()