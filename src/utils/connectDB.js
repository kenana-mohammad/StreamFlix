const { default: mongoose } = require('mongoose');
require('dotenv').config();

const connectDB = async() => {
    try {
        await mongoose.connect(process.env.MONGOOSE_URL);
        console.log('connected to mongoose');
    } catch (error) {
        console.log('Error', error.message);
        throw error;
    }
};

module.exports = connectDB;