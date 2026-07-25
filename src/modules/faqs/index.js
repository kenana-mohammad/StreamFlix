const router = require("express").Router();

router.use("/", require("./routes/faq.routes"));

module.exports = router;