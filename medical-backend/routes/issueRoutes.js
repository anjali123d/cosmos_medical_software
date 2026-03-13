const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const Issue = require("../models/Issue");
const Patient = require("../models/Patient");
const MedicalItem = require("../models/MedicalItem");
const Return = require("../models/Return");


/* ===============================
   CREATE ISSUE
================================= */

router.post("/", async (req, res) => {

    const session = await mongoose.startSession();
    session.startTransaction();

    try {

        const { receiptNo, reference, remarks, patient, items, renewDate, totalDeposit } = req.body;

        let processedItems = [];
        let totalAmount = 0;

        for (const i of items) {

            const item = await MedicalItem.findById(i.item).session(session);

            if (!item) throw new Error("Item not found");

            if (item.totalStock < i.qty) {
                throw new Error(`Not enough stock for ${item.itemName}`);
            }

            await MedicalItem.findByIdAndUpdate(
                i.item,
                { $inc: { totalStock: -i.qty } },
                { session }
            );

            const price = item.depositPerItem || 0;
            const amount = price * i.qty;

            processedItems.push({
                item: item._id,
                itemName: item.itemName,
                qty: i.qty,
                price: price,
                deposit: price,
                amount: amount,
                returnedQty: 0
            });

            totalAmount += amount;
        }

        const issue = await Issue.create([{
            receiptNo,
            reference,
            remarks,
            patient,
            renewDate,
            items: processedItems,
            totalAmount,
            totalDeposit
        }], { session });

        await session.commitTransaction();
        session.endSession();

        res.json(issue[0]);

    } catch (err) {

        await session.abortTransaction();
        session.endSession();

        res.status(500).json({ message: err.message });

    }

});


/* ===============================
   UPDATE ISSUE
================================= */

router.put("/:id", async (req, res) => {

    const session = await mongoose.startSession();
    session.startTransaction();

    try {

        const issue = await Issue.findById(req.params.id).session(session);

        if (!issue) throw new Error("Issue not found");

        /* restore previous stock */

        for (const i of issue.items) {

            await MedicalItem.findByIdAndUpdate(
                i.item,
                { $inc: { totalStock: i.qty } },
                { session }
            );

        }

        let processedItems = [];
        let totalAmount = 0;

        for (const i of req.body.items) {

            const item = await MedicalItem.findById(i.item).session(session);

            if (!item) throw new Error("Item not found");

            if (item.totalStock < i.qty) {
                throw new Error(`Not enough stock for ${item.itemName}`);
            }

            await MedicalItem.findByIdAndUpdate(
                i.item,
                { $inc: { totalStock: -i.qty } },
                { session }
            );

            const price = item.depositPerItem || 0;
            const amount = price * i.qty;

            processedItems.push({
                item: item._id,
                itemName: item.itemName,
                qty: i.qty,
                price: price,
                deposit: price,
                amount: amount,
                returnedQty: 0
            });

            totalAmount += amount;

        }

        issue.items = processedItems;
        issue.totalAmount = totalAmount;

        issue.reference = req.body.reference;
        issue.remarks = req.body.remarks;
        issue.renewDate = req.body.renewDate;
        issue.totalDeposit = req.body.totalDeposit;

        await issue.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.json(issue);

    } catch (err) {

        await session.abortTransaction();
        session.endSession();

        res.status(500).json({ message: err.message });

    }

});


/* ===============================
   DELETE ISSUE
================================= */

router.delete("/:id", async (req, res) => {

    const session = await mongoose.startSession();
    session.startTransaction();

    try {

        const issue = await Issue.findById(req.params.id).session(session);

        if (!issue) throw new Error("Issue not found");

        for (const i of issue.items) {

            await MedicalItem.findByIdAndUpdate(
                i.item,
                { $inc: { totalStock: i.qty } },
                { session }
            );

        }

        await issue.deleteOne({ session });

        await session.commitTransaction();
        session.endSession();

        res.json({ message: "Issue deleted successfully" });

    } catch (err) {

        await session.abortTransaction();
        session.endSession();

        res.status(500).json({ message: err.message });

    }

});


/* ===============================
   GET ALL ISSUES
================================= */

router.get("/", async (req, res) => {

    try {

        const issues = await Issue.find()
            .populate("patient")
            .populate("items.item")
            .sort({ createdAt: -1 });

        res.json(issues);

    } catch (err) {

        res.status(500).json({ message: "Failed to fetch issues" });

    }

});


/* ===============================
   GET ACTIVE ISSUES
================================= */

router.get("/active", async (req, res) => {

    try {

        const issues = await Issue.find({ isReturned: false })
            .populate("patient")
            .populate("items.item")
            .sort({ createdAt: -1 });

        res.json(issues);

    } catch (err) {

        res.status(500).json({ message: "Failed to fetch active issues" });

    }

});


/* ===============================
   RETURN ITEMS
================================= */

router.post("/return", async (req, res) => {

    const session = await mongoose.startSession();
    session.startTransaction();

    try {

        const { issueId, items } = req.body;

        const issue = await Issue.findById(issueId).session(session);

        if (!issue) throw new Error("Issue not found");

        let totalRefund = 0;
        let totalDamageCharge = 0;

        const returnItems = [];

        for (const r of items) {

            const issueItem = issue.items.find(
                i => i.item.toString() === r.itemId
            );

            if (!issueItem) throw new Error("Item not part of this issue");

            const remainingQty = issueItem.qty - issueItem.returnedQty;

            if (r.qty > remainingQty) {
                throw new Error("Return qty exceeds remaining qty");
            }

            const refund =
                (issueItem.deposit * r.qty) - (r.damageCharge || 0);

            issueItem.returnedQty += r.qty;

            await MedicalItem.findByIdAndUpdate(
                r.itemId,
                { $inc: { totalStock: r.qty } },
                { session }
            );

            totalRefund += refund;
            totalDamageCharge += r.damageCharge || 0;

            returnItems.push({
                itemId: r.itemId,
                itemName: issueItem.itemName,
                qty: r.qty,
                depositPerItem: issueItem.deposit,
                damageCharge: r.damageCharge || 0,
                refundAmount: refund
            });

        }

        const allReturned = issue.items.every(
            i => i.qty === i.returnedQty
        );

        if (allReturned) {

            issue.isReturned = true;
            issue.returnedAt = new Date();

        }

        await issue.save({ session });

        const returnDoc = await Return.create([{
            issue: issueId,
            patient: issue.patient,
            items: returnItems,
            totalRefund,
            totalDamageCharge
        }], { session });

        await session.commitTransaction();
        session.endSession();

        res.json({
            message: "Items returned successfully",
            data: returnDoc[0]
        });

    } catch (err) {

        await session.abortTransaction();
        session.endSession();

        res.status(500).json({ message: err.message });

    }

});

module.exports = router;