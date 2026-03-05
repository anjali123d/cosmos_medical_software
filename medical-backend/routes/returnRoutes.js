const express = require("express");
const router = express.Router();
const Return = require("../models/Return");
const Issue = require("../models/Issue");
const MedicalItem = require("../models/MedicalItem");

/* ===============================
   POST : Return Item
================================ */
router.post("/", async (req, res) => {

    const { issueId, itemId, qty } = req.body;

    const issue = await Issue.findById(issueId);

    const issueItem = issue.items.find(i => i.item.toString() === itemId);

    if (!issueItem) {
        return res.status(404).json({ message: "Item not found in issue" });
    }

    if (qty > issueItem.qty) {
        return res.status(400).json({ message: "Invalid quantity" });
    }

    const medicalItem = await MedicalItem.findById(itemId);

    medicalItem.totalStock += qty;
    await medicalItem.save();

    issueItem.qty -= qty;

    await issue.save();

    res.json({ message: "Item returned successfully" });

});
/* ===============================
   GET : Return History
================================ */
router.get("/history", async (req, res) => {
    try {
        const returns = await Return.find()
            .populate({
                path: "issue",
                populate: ["patient", "items"]
            })
            .sort({ createdAt: -1 });

        res.json(returns);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch returns" });
    }
});

/* ===============================
   GET : All Returns
================================ */
router.get("/", async (req, res) => {
    try {
        const returns = await Return.find()
            .populate({
                path: "issue",
                populate: ["patient", "items"]
            })
            .sort({ createdAt: -1 });

        res.json(returns);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch returns" });
    }
});

/* ===============================
   GET : Single Return
================================ */
router.get("/:id", async (req, res) => {
    try {
        const returnItem = await Return.findById(req.params.id)
            .populate({
                path: "issue",
                populate: ["patient", "items"]
            });

        if (!returnItem) {
            return res.status(404).json({ message: "Return not found" });
        }

        res.json(returnItem);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch return" });
    }
});

module.exports = router;