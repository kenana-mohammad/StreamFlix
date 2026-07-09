//convert jwt to class and meyhod in class to resubilty  easy
//
const jwt = require('jsonwebtoken');
class JwtService {
    sign(payload) {
            return jwt.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn: '1 h' });
        }
        //============
    genrateAccessToken = (payload) => {
        return jwt.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn: '1 h' })
    }

    //refreash token 
    genrateRefreshToken = (payload) => {
            return jwt.sign(payload, process.env.REFRESH_JWT_SECRET_KEY, { expiresIn: '7d' })
        }
        //verify 
    verifyAccessToken(token) {
        return jwt.verify(token, process.env.JWT_SECRET_KEY);
    }
    verifyRefreshToken(token) {
        return jwt.verify(token, process.env.REFRESH_JWT_SECRET_KEY);
    }
}
module.exports = new JwtService();