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

    qty: {
        type: Number,
        required: true,
        min: 1
    },


    damageCharge: {
        type: Number,
        default: 0
    },


    refundAmount: {
        type: Number,
        default: 0
    }

}, { timestamps: true });

module.exports = mongoose.model("Return", returnSchema);