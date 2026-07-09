const { default: mongoose } = require("mongoose")

const id = (req, res, next) => {
    const id = req.params.id
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json('id invaild')
    }
    next()
}
module.exports = id