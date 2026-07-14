//
const cookiesService = require('../utils/cookiesService');
const jwtService = require('./../utils/jwtService');
const auth = (req, res, next) => {
    try {
        const token = cookiesService.getAccessToken(req)

        if (!token) {
            return res.status(403).json({
                msg: "Not Authorized"
            })
        }

        const decoded = jwtService.verifyAccessToken(token);
        req._user = {...decoded }
        console.log(decoded)
        next()

    } catch (error) {

        return res.status(403).json({
            msg: "Not Authorized"
        })
    }

}
module.exports = auth