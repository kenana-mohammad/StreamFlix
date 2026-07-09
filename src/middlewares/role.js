const role = (roles) => {
    //hof
    return (req, res, next) => {
        if (roles.includes(req._user.role)) {
            next()

        } else {
            return res.status(403).json({
                msg: "the Action canot maken by this user"
            })
        }

    }
}
module.exports = role