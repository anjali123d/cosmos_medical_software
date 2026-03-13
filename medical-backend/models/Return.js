const mongoose = require("mongoose");

const returnItemSchema = new mongoose.Schema({

    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MedicalItem",
        required: true
    },

    itemName: String,

    qty: {
        type: Number,
        required: true,
        min: 1
    },

    depositPerItem: Number,

    damageCharge: {
        type: Number,
        default: 0
    },

    refundAmount: {
        type: Number,
        default: 0
    }

});

const returnSchema = new mongoose.Schema({

    issue: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Issue",
        required: true
    },

    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient"
    },

    items: [returnItemSchema],

    totalRefund: {
        type: Number,
        default: 0
    },

    totalDamageCharge: {
        type: Number,
        default: 0
    },

    returnDate: {
        type: Date,
        default: Date.now
    }

}, { timestamps: true });

module.exports = mongoose.model("Return", returnSchema);