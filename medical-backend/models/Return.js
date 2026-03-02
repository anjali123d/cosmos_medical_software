const mongoose = require("mongoose");

const returnSchema = new mongoose.Schema({
    issue: { type: mongoose.Schema.Types.ObjectId, ref: "Issue" },
    returnDate: { type: Date, default: Date.now },
    damageCharge: Number,
    refundAmount: Number,
}, { timestamps: true });

module.exports = mongoose.model("Return", returnSchema);