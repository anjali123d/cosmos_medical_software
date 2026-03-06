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

        const { issueId, itemId, qty, damageCharge = 0 } = req.body;

        const issue = await Issue.findById(issueId);

        if (!issue) {
            return res.status(404).json({ message: "Issue not found" });
        }

        const issueItem = issue.items.find(
            i => i.item.toString() === itemId
        );

        if (!issueItem) {
            return res.status(404).json({ message: "Item not in issue" });
        }

        const remaining = issueItem.qty - issueItem.returnedQty;

        if (qty > remaining) {
            return res.status(400).json({ message: "Return qty exceeds" });
        }

        issueItem.returnedQty += qty;

        const item = await MedicalItem.findById(itemId);

        item.totalStock += qty;

        await item.save();

        const refundAmount = (item.depositPerItem * qty) - damageCharge;

        await Return.create({
            issue: issueId,
            itemId,
            qty,
            damageCharge,
            refundAmount
        });

        /* check full return */

        const allReturned = issue.items.every(
            i => i.qty === i.returnedQty
        );

        if (allReturned) {
            issue.isReturned = true;
            issue.returnedAt = new Date();
        }

        await issue.save();

        res.json({ message: "Return success" });

    } catch (err) {

        console.log(err);
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
                populate: [
                    { path: "patient" },
                    { path: "items.item" }
                ]
            })
            .populate("itemId")
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
                populate: [
                    { path: "patient" },
                    { path: "items.item" }
                ]
            })
            .populate("itemId")
            .sort({ createdAt: -1 });

        res.json(returns);

    } catch (err) {

        console.error(err);
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
                populate: [
                    { path: "patient" },
                    { path: "items.item" }
                ]
            })
            .populate("itemId");

        if (!returnItem) {
            return res.status(404).json({ message: "Return not found" });
        }

        res.json(returnItem);

    } catch (err) {

        console.error(err);
        res.status(500).json({ message: "Failed to fetch return" });

    }

});


module.exports = router;