const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        await mongoose.connect("mongodb+srv://anjalidhapa22_db_user:Xv5aGwHgl3IVjs8O@cluster0.p9uh7n9.mongodb.net/?appName=Cluster0");
        console.log("MongoDB Connected");
    } catch (error) {
        console.error("Database connection failed:", error.message);
        process.exit(1);
    }
};

module.exports = connectDB;