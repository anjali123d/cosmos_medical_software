const mongoose = require("mongoose");

const issueSchema = new mongoose.Schema({

    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient",
        required: true
    },

    receiptNo: {
        type: String,
        required: true
    },

    reference: String,

    items: [
        {
            item: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "MedicalItem"
            },
            qty: {
                type: Number,
                default: 1
            }
        }
    ],

    totalDeposit: {
        type: Number,
        required: true
    },

    isReturned: {
        type: Boolean,
        default: false
    },

    returnedAt: Date

}, { timestamps: true });

module.exports = mongoose.model("Issue", issueSchema);