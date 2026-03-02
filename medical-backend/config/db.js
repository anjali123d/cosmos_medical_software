const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        await mongoose.connect("mongodb+srv://cosmosbvn_db_user:cosmos123@mcqtestcluster0.8lbkhd3.mongodb.net/?appName=mcqTestCluster0");
        console.log("MongoDB Connected");
    } catch (error) {
        console.error("Database connection failed:", error.message);
        process.exit(1);
    }
};

module.exports = connectDB;