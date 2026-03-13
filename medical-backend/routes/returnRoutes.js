const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const Return = require("../models/Return");
const Issue = require("../models/Issue");
const MedicalItem = require("../models/MedicalItem");

/* ===============================
   POST : Return Items
================================ */

router.post("/", async (req, res) => {

    const session = await mongoose.startSession();
    session.startTransaction();

    try {

        const { issueId, items } = req.body;

        if (!issueId || !items || items.length === 0) {
            return res.status(400).json({
                message: "Issue ID and items required"
            });
        }

        /* find issue */

        const issue = await Issue.findById(issueId).session(session);

        if (!issue) {
            return res.status(404).json({
                message: "Issue not found"
            });
        }

        const returnItems = [];

        let totalRefund = 0;
        let totalDamageCharge = 0;

        for (const rItem of items) {

            const { itemId, qty, damageCharge = 0 } = rItem;

            if (!itemId || !qty) {
                throw new Error("Invalid return item data");
            }

            /* find item in issue */

            const issueItem = issue.items.find(
                i => i.item.toString() === itemId
            );

            if (!issueItem) {
                throw new Error("Item not part of this issue");
            }

            const returnedQty = issueItem.returnedQty || 0;
            const remainingQty = issueItem.qty - returnedQty;

            if (qty > remainingQty) {
                throw new Error(`Max return allowed: ${remainingQty}`);
            }

            /* find item */

            const item = await MedicalItem.findById(itemId).session(session);

            if (!item) {
                throw new Error("Item not found");
            }

            /* update returned qty */

            issueItem.returnedQty = returnedQty + qty;

            /* update stock */

            item.totalStock += qty;

            await item.save({ session });

            /* refund calculation */

            const depositPerItem = item.depositPerItem || 0;

            const deposit = depositPerItem * qty;

            const refundAmount = Math.max(
                deposit - damageCharge,
                0
            );

            totalRefund += refundAmount;
            totalDamageCharge += damageCharge;

            returnItems.push({

                itemId: item._id,
                itemName: item.itemName,
                qty: qty,
                depositPerItem: depositPerItem,
                damageCharge: damageCharge,
                refundAmount: refundAmount

            });

        }

        /* check if all items returned */

        const allReturned = issue.items.every(
            i => i.qty === (i.returnedQty || 0)
        );

        if (allReturned) {

            issue.isReturned = true;
            issue.returnedAt = new Date();

        }

        await issue.save({ session });

        /* create return history */

        const returnDoc = await Return.create([{

            issue: issue._id,
            patient: issue.patient,

            items: returnItems,

            totalRefund: totalRefund,
            totalDamageCharge: totalDamageCharge

        }], { session });

        await session.commitTransaction();
        session.endSession();

        res.json({
            message: "Return successful",
            data: returnDoc[0]
        });

    } catch (err) {

        await session.abortTransaction();
        session.endSession();

        console.error(err);

        res.status(500).json({
            message: err.message || "Return failed"
        });

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
            .populate("items.itemId")
            .sort({ createdAt: -1 });

        res.json(returns);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: "Failed to fetch returns"
        });

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
            .populate("items.itemId")
            .sort({ createdAt: -1 });

        res.json(returns);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: "Failed to fetch return history"
        });

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
            .populate("items.itemId");

        if (!returnItem) {
            return res.status(404).json({
                message: "Return not found"
            });
        }

        res.json(returnItem);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: "Failed to fetch return"
        });

    }

});

module.exports = router;