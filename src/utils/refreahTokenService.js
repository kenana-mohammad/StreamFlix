const cookiesService = require("./cookiesService");
const jwtService = require("./jwtService");

const refreshTokenService = (req, res) => {
    const refrehToken = cookiesService.getRefreshToken(req);
    if (!refrehToken) {
        return res.status(401).json({
            msg: "refresh token is reqired"
        })
    }
    const decoded = jwtService.verifyRefreshToken(refrehToken);
    const data = {
        id: decoded._id,
        email: decoded.email,
        role: decoded.role
    }

    //بفكا اذا تمام مو خالصة برجع بولد توكين ديد وبخزنو ب cookie
    const token = jwtService.genrateAccessToken(data);
    const refToken = jwtService.genrateRefreshToken(data);
    //save in cookie updated

    cookiesService.setAccessToken(res, token);
    cookiesService.setRefreshToken(res, refToken);

}
module.exports = refreshTokenService