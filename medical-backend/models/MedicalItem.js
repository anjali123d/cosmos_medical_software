const mongoose = require("mongoose");

const medicalItemSchema = new mongoose.Schema({
    itemName: String,
    totalStock: Number,
    depositPerItem: Number,
}, { timestamps: true });

module.exports = mongoose.model("MedicalItem", medicalItemSchema);