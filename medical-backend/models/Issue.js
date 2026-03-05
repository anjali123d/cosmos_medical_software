const mongoose = require("mongoose");

const issueSchema = new mongoose.Schema({

    // Patient reference
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient",
        required: true
    },

    // ✅ Multiple items
    items: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "MedicalItem"
    }],

    // ✅ Receipt number
    receiptNo: {
        type: String,
        required: true
    },

    // ✅ Reference field
    reference: {
        type: String
    },

    // Total deposit amount
    totalDeposit: {
        type: Number,
        required: true
    },

    // Return Status
    isReturned: {
        type: Boolean,
        default: false
    },

    returnedAt: {
        type: Date
    }

}, { timestamps: true });

module.exports = mongoose.model("Issue", issueSchema);