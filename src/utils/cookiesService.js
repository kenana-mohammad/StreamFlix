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
            return req.cookies['refrehToken']
        }
        //set data if response to save in front
    setData = async(res, key, value) => {
            return res.cookie(key, value, cookieConfig)

        }
        //رح نفصل اخزين كل وحدة الا وقت بالكزيزيز 
    setAccessToken = (res, value) => {
            return res.cookie('accessToken', value, {
                httpOnly: true,
                secure: false, //https
                maxAge: 60 * 60 * 1000,
                sameSite: 'strict'
            })
        }
        //refresh token ميتا اطول 
    setRefreshToken = (res, value) => {
            return res.cookie('refrehToken', value, {
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
        this.clearData(res, "refrehToken")
    }
}
module.exports = new CookiesService();