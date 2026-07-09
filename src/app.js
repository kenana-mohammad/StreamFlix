require('dotenv').config();
const express = require('express');
const app = express();
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}))
app.use(require('morgan')('dev'));
const path = require("path");
const PORT = process.env.PORT || 3000;
const MONGOOSE_URL = process.env.MONGOOSE_URL;
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');
//use server support cookies
const cookies = require('cookie-parser');
const {
    limiter
} = require('./middlewares/limiter');
const cors = require('cors')
app.use(cors({
    origin: "*"
}))
app.use(cookies());
//
app.use("/uploads", express.static(path.join(__dirname, "../uploads")))

app.use(limiter);
const xssSanitize = require('./middlewares/xss');
app.use(xssSanitize);
app.use(express.static('public'))

//========================================================
app.get('/api/health', (req, res) => {
    return res.status(200).json('the api is healthy')
});


app.use(notFound);
app.use(errorHandler);


const mongoose = require('mongoose');
mongoose.connect(MONGOOSE_URL).then(() => {
    app.listen(PORT, () => {
        console.log(`the server is runnig == ${PORT}`);

    })

}).catch((error) => {
    console.log(error.message);

})