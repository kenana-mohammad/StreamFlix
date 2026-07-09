const page = (req, res, next) => {
    const page = +req.query.page;
    req._page = page;
    next()
}
module.exports = page