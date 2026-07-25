const router = require("express").Router();

const controller = require("../controllers/faq.controller");

router.get("/", controller.getFAQs);

module.exports = router;