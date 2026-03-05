const express = require("express");
const router = express.Router();
const Issue = require("../models/Issue");
const MedicalItem = require("../models/MedicalItem");

// Create 
Issuerouter.post("/", async (req, res) => {
    try {

        const { patient, items, receiptNo, reference, totalDeposit } = req.body;

        if (!patient || !items || items.length === 0 || !receiptNo) {
            return res.status(400).json({ message: "Invalid input data" });
        }

        // Check stock for each item
        for (let itemId of items) {

            const medicalItem = await MedicalItem.findById(itemId);

            if (!medicalItem) {
                return res.status(404).json({ message: "Item not found" });
            }

            if (medicalItem.totalStock <= 0) {
                return res.status(400).json({
                    message: `${medicalItem.itemName} out of stock`
                });
            }

            // Reduce stock
            medicalItem.totalStock -= 1;
            await medicalItem.save();
        }

        const issue = await Issue.create({
            patient,
            items,
            receiptNo,
            reference,
            totalDeposit
        });

        res.status(201).json(issue);

    } catch (err) {
        console.error("Issue Error:", err);
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