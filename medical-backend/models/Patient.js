const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema({

    patientName: String,
    mobile: String,
    city: String,
    address: String

}, { timestamps: true });

module.exports = mongoose.model("Patient", patientSchema);