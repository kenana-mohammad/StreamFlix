require('dotenv').config();
const express = require('express');
const app = express();

app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));
app.use(require('morgan')('dev'));
const path = require("path");
const PORT = process.env.PORT || 3000;
const MONGOOSE_URL = process.env.MONGOOSE_URL;
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');
const schedulerService = require('./modules/content/services/scheduler.service');
//use server support cookies
const cookies = require('cookie-parser');
const {
    limiter
} = require('./middlewares/limiter');
const cors = require('cors');

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

const apiRoutes = require('./modules/content/index');
app.use('/api/v1', apiRoutes);

app.get('/api/health', (req, res) => {
        return res.status(200).json('the api is healthy')
    })
    // auth
app.use('/api/v1/auth', require("./modules/auth/routes/auth.routes"));
//profile
app.use('/api/v1/users', require("./modules/users/routes/user.routes"));
//profile alaa
app.use('/api/v1/users/profiles' , require("./modules/profiles/routes/profile.routes"))
//=============================================
//cast
app.use('/api/v1/cast', require('./modules/casts/routes/cast.routes'));
//plans
app.use("/api/v1/plans", require("./modules/plans/index"));
//genres
app.use("/api/v1/genres", require("./modules/genres/index"));
//section dashboard routes
app.use('/api/v1/admin/analytics', require('./modules/dashboard/routes/dashboard.routes'));
app.use('/api/v1/admin/users', require('./modules/dashboard/routes/dashboard.users.route'));
app.use('/api/v1/devices', require("./modules/devices/routes/device.routes"));
app.use('/api/v1/dashboard', require('./modules/dashboard/routes/dashboard.routes'));
app.use('/api/v1/dashboard/users', require('./modules/dashboard/routes/dashboard.users.route'));


app.use(notFound);
app.use(errorHandler);


const mongoose = require('mongoose');
mongoose.connect(MONGOOSE_URL).then(() => {

    schedulerService.init();
    console.log('Scheduler initialized successfully');

    app.listen(PORT, () => {
        console.log(`the server is runnig == ${PORT}`);

    })

}).catch((error) => {
    console.log(error.message);

})