// //
// const jwtService = require('./../utils/jwtService');
// const authLocalStorage = (req, res, next) => {
//     try {
//         const authorization = req.headers.authorization; //barear
//         if (!authorization) {
//             return res.status(403).json({
//                 msg: "Not Authorized=="
//             })
//         }
//         //fetch the token ;
//         console.log(1)
//         const token = authorization.split(" ")[1];
//         console.log(token)


//         const decoded = jwtService.verify(token);
//         //send data to api to use it in profile
//         req._user = {...decoded }
//         console.log(decoded)
//         next()

//     } catch (error) {
//         //if the token is expirein or not genrate from system
//         return res.status(403).json({
//             msg: "Not Authorized"
//         })
//     }

// }
// module.exports = authLocalStorage