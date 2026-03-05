const express = require("express");
const router = express.Router();
const Issue = require("../models/Issue");
const MedicalItem = require("../models/MedicalItem");

// Create Issue
router.post("/", async (req, res) => {
    try {
        const { patient, item, qty } = req.body;

        // Validation
        if (!patient || !item || !qty || qty <= 0) {
            return res.status(400).json({ message: "Invalid input data" });
        }

        const medicalItem = await MedicalItem.findById(item);

        if (!medicalItem) {
            return res.status(404).json({ message: "Item not found" });
        }

        if (medicalItem.totalStock < qty) {
            return res.status(400).json({ message: "Not enough stock available" });
        }

        // Calculate deposit
        const totalDeposit = qty * medicalItem.depositPerItem;

        // Reduce stock
        medicalItem.totalStock -= qty;
        await medicalItem.save();

        // Create issue
        const issue = await Issue.create({
            patient,
            item,
            qty,
            totalDeposit,
            isReturned: false
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
            .populate("item")
            .sort({ createdAt: -1 });

        res.json(issues);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch issues" });
    }
});


// Get active issues (not returned)
router.get("/active", async (req, res) => {
    try {
        const issues = await Issue.find({ isReturned: false })
            .populate("patient")
            .populate("item")
            .sort({ createdAt: -1 });

        res.json(issues);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch active issues" });
    }
});

module.exports = router;