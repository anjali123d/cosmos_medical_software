const express = require("express");
const router = express.Router();
const Issue = require("../models/Issue");
const MedicalItem = require("../models/MedicalItem");

router.post("/", async (req, res) => {
    try {
        const { patient, item, qty } = req.body;

        if (!patient || !item || !qty || qty <= 0) {
            return res.status(400).json({ message: "Invalid input data" });
        }

        const medicalItem = await MedicalItem.findById(item);

        if (!medicalItem) {
            return res.status(404).json({ message: "Item not found" });
        }

        if (medicalItem.totalStock < qty) {
            return res.status(400).json({ message: "Not enough stock" });
        }

        const totalDeposit = qty * medicalItem.depositPerItem;

        // 🔻 Reduce stock
        medicalItem.totalStock -= qty;
        await medicalItem.save();

        const issue = await Issue.create({
            patient,
            item,
            qty,
            totalDeposit,
            isReturned: false // ✅ explicitly set
        });

        res.json(issue);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Issue failed" });
    }
});

router.get("/", async (req, res) => {
    try {
        const issues = await Issue.find()
            .populate("patient")
            .populate("item")
            .sort({ createdAt: -1 });

        res.json(issues);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch issues" });
    }
});

router.get("/active", async (req, res) => {
    try {
        const issues = await Issue.find({ isReturned: false })
            .populate("patient")
            .populate("item")
            .sort({ createdAt: -1 });

        res.json(issues);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch active issues" });
    }
});

module.exports = router;