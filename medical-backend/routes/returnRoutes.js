const express = require("express");
const router = express.Router();
const Return = require("../models/Return");
const Issue = require("../models/Issue");
const MedicalItem = require("../models/MedicalItem");

/* ===============================
   POST : Return Item
================================ */
router.post("/", async (req, res) => {
    try {
        const { issueId, damageCharge } = req.body;

        if (!issueId) {
            return res.status(400).json({ message: "Issue ID required" });
        }

        const issue = await Issue.findById(issueId).populate("item");

        if (!issue) {
            return res.status(404).json({ message: "Issue not found" });
        }

        if (issue.isReturned) {
            return res.status(400).json({ message: "Item already returned" });
        }

        const refundAmount = Math.max(
            issue.totalDeposit - Number(damageCharge),
            0
        );

        // 🔁 Restore stock
        const item = await MedicalItem.findById(issue.item._id);
        item.totalStock += issue.qty;
        await item.save();

        // ✅ Mark issue as returned
        issue.isReturned = true;
        issue.returnedAt = new Date();
        await issue.save();

        // 🧾 Create return record
        const returnItem = await Return.create({
            issue: issue._id,
            damageCharge: Number(damageCharge),
            refundAmount,
        });

        res.json(returnItem);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Return failed" });
    }
});
/* ===============================
   GET : Return History
================================ */
router.get("/history", async (req, res) => {
    try {
        const returns = await Return.find()
            .populate({
                path: "issue",
                populate: ["patient", "item"]
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
                populate: ["patient", "item"]
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
                populate: ["patient", "item"]
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