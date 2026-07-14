const express = require('express');
const router = express.Router();

const dashboardroutes = require('./routes/dashboard.routes');
const dashboardusersroutes = require('./routes/dashboard.users.route');

router.use('/analytics', dashboardroutes);
router.use('/users', dashboardusersroutes);


module.exports = router;