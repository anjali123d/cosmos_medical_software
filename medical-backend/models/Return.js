const mongoose = require("mongoose");

const returnSchema = new mongoose.Schema({

    issue: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Issue"
    },

    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MedicalItem"
    },

    qty: Number,

    damageCharge: {
        type: Number,
        default: 0
    },

    refundAmount: Number

}, { timestamps: true });

module.exports = mongoose.model("Return", returnSchema);