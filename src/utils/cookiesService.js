//
const cookieConfig = {
    httpOnly: true,
    secure: false, //https
    maxAge: 15 * 60 * 1000,
    sameSite: 'strict'

}
class CookiesService {

    getData = (req, key) => {
        return req.cookies[key]
    }
    //==================
    //get access '
    getAccessToken = (req) => {
        return req.cookies['accessToken']
    }
    //=======
    getRefreshToken = (req) => {
        return req.cookies['refreshToken']
    }
    //set data if response to save in front
    setData =  (res, key, value) => {
        return res.cookie(key, value, cookieConfig)

    }
    setAccessToken = (res, value) => {
        return res.cookie('accessToken', value, {
            httpOnly: true,
            secure: false, //https
            maxAge: 60 * 60 * 1000,
            sameSite: 'strict'
        })
    }
    //refresh token  اطول 
    setRefreshToken = (res, value) => {
        return res.cookie('refreshToken', value, {
            httpOnly: true,
            secure: false, //https
            maxAge: 7 * 24 * 60 * 60 * 1000, //7 day
            sameSite: 'strict'
        })
    }
    //clear
    clearData = (res, key) => {
        return res.clearCookie(key)

    }
    clearTokens = (res, key) => {
        this.clearData(res, "accessToken")
        this.clearData(res, "refreshToken")
    }
}
module.exports = new CookiesService();