const mongoose = require("mongoose");

const issueSchema = new mongoose.Schema({
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    item: { type: mongoose.Schema.Types.ObjectId, ref: "MedicalItem", required: true },
    qty: { type: Number, required: true },

    totalDeposit: { type: Number, required: true },

    // ✅ NEW FIELDS
    isReturned: { type: Boolean, default: false },
    returnedAt: { type: Date },

}, { timestamps: true });

module.exports = mongoose.model("Issue", issueSchema);