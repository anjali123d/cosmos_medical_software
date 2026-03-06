const mongoose = require("mongoose");

const IssueSchema = new mongoose.Schema(
    {

        receiptNo: {
            type: String,
            required: true,
            unique: true
        },
        reference: String,
        remarks: String,

        patient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Patient"
        },

        renewDate: Date,

        items: [
            {
                item: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "MedicalItem"
                },

                qty: Number,

                returnedQty: {
                    type: Number,
                    default: 0
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