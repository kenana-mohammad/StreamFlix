const nodemailer = require("nodemailer")
require('dotenv').config();
const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
        user: process.env.MAILTRAP_EMAIL_USER,
        pass: process.env.MAILTRAP_EMAIL_PASS
    }
});

const sendMail = async(from, to, subject, text) => {
    await transporter.sendMail({
        from: from,
        to: to,
        subject: subject,
        text: text

    })

};
module.exports = {sendMail};