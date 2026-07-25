// const jwt = require("jsonwebtoken");

// class ResetService {
//     generateResetToken = (email) => {
//    const token = jwt.sign(
//     {email},
//     process.env.JWT_RESET_SECRET,
//     {expiresIn : '10m'}
//    );
// };
//   verifyResetToken = (token) => {
//     try {
//         const decoded = jwt.verify(token, process.env.JWT_RESET_SECRET);
//         return decoded.email; 
//     } catch (error) {
//         throw new Error('Invalid or expired reset token');
//     }
// };
// }
// module.exports = new ResetService();
