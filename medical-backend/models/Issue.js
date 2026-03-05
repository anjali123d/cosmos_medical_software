const mongoose = require("mongoose");

const IssueSchema = new mongoose.Schema(
    {
        receiptNo: String,

        reference: String,

        patient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Patient"
        },

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

        totalDeposit: Number,

        isReturned: {
            type: Boolean,
            default: false
        },

        returnedAt: Date
    },
    { timestamps: true }
);

module.exports = mongoose.model("Issue", IssueSchema);