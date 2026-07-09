const notFound = (req, res) => {
    res.status(404).json('The Route is not exists')
}
module.exports = notFound