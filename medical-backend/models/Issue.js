const mongoose = require("mongoose");

const IssueItemSchema = new mongoose.Schema(
    {
        item: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "MedicalItem",
            required: true
        },

        // Store item name at the time of issue
        itemName: {
            type: String,
            required: true
        },

        qty: {
            type: Number,
            required: true
        },

        price: {
            type: Number,
            required: true
        },

        deposit: {
            type: Number,
            default: 0
        },

        amount: {
            type: Number,
            default: 0
        },

        returnedQty: {
            type: Number,
            default: 0
        }
    },
    { _id: true }
);

const IssueSchema = new mongoose.Schema(
    {
        receiptNo: {
            type: String,
            required: true,
            unique: true
        },

        reference: {
            type: String,
            default: ""
        },

        samirSirReference: {
            type: Boolean,
            default: false
        },

        remarks: {
            type: String,
            default: ""
        },

        patient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Patient",
            required: true
        },

        // Actual date when items were issued
        issueDate: {
            type: Date,
            default: Date.now
        },

        // Date for renewal, if applicable
        renewDate: {
            type: Date,
            default: null
        },

        items: {
            type: [IssueItemSchema],
            required: true
        },

        totalAmount: {
            type: Number,
            default: 0
        },

        totalDeposit: {
            type: Number,
            default: 0
        },

        isReturned: {
            type: Boolean,
            default: false
        },

        // Actual date when the issue was completely returned
        returnedAt: {
            type: Date,
            default: null
        }
    }
);

module.exports = mongoose.model("Issue", IssueSchema);