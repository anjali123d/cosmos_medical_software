const mongoose = require("mongoose");

const IssueItemSchema = new mongoose.Schema({
    
    item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MedicalItem",
        required: true
    },

    itemName: String, // snapshot for history

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
        type: Number
    },

    returnedQty: {
        type: Number,
        default: 0
    }

});

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
        ref: "Patient",
        required: true
    },

    issueDate: {
        type: Date,
        default: Date.now
    },

    renewDate: Date,

    items: [IssueItemSchema],

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

    returnedAt: Date

},
{ timestamps: true }
);

module.exports = mongoose.model("Issue", IssueSchema);