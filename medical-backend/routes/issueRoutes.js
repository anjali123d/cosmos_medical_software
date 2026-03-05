const express = require("express");
const router = express.Router();
const Issue = require("../models/Issue");
const MedicalItem = require("../models/MedicalItem");

// Create 
router.post("/", async (req, res) => {

    try {

        const { patient, items, receiptNo, reference } = req.body;

        if (!patient || !items || items.length === 0) {
            return res.status(400).json({ message: "Invalid data" });
        }

        let totalDeposit = 0;

        for (let data of items) {

            const medicalItem = await MedicalItem.findById(data.item);

            if (!medicalItem) {
                return res.status(404).json({ message: "Item not found" });
            }

            if (medicalItem.totalStock < data.qty) {
                return res.status(400).json({
                    message: `${medicalItem.itemName} stock not available`
                });
            }

            // reduce stock
            medicalItem.totalStock -= data.qty;
            await medicalItem.save();

            totalDeposit += medicalItem.depositPerItem * data.qty;
        }

        const issue = await Issue.create({
            patient,
            receiptNo,
            reference,
            items,
            totalDeposit
        });

        res.json(issue);

    } catch (err) {
        res.status(500).json({ message: "Issue failed" });
    }

});

// Get all issues
router.get("/", async (req, res) => {
    try {

        const issues = await Issue.find()
            .populate("patient")
            .populate("items")
            .sort({ createdAt: -1 });

        res.json(issues);

    } catch (err) {
        res.status(500).json({ message: "Failed to fetch issues" });
    }
});


// Get active issues (not returned)
router.get("/active", async (req, res) => {
    try {
        const issues = await Issue.find({ isReturned: false })
            .populate("patient")
            .populate("items")
            .sort({ createdAt: -1 });

        res.json(issues);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch active issues" });
    }
});

module.exports = router;