const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const Issue = require("../models/Issue");
const Patient = require("../models/Patient");
const MedicalItem = require("../models/MedicalItem");


/* ===============================
   CREATE NEW ISSUE
================================= */

router.post("/", async (req, res) => {

    const session = await mongoose.startSession();
    session.startTransaction();

    try {

        const { receiptNo, reference, remarks, patient, items, renewDate, totalDeposit } = req.body;

        for (const i of items) {

            const item = await MedicalItem.findById(i.item).session(session);

            if (!item) {
                throw new Error("Item not found");
            }

            if (item.totalStock < i.qty) {
                throw new Error(`Not enough stock for ${item.itemName}`);
            }

            await MedicalItem.findByIdAndUpdate(
                i.item,
                { $inc: { totalStock: -i.qty } },
                { session }
            );

        }

        const issue = await Issue.create([{
            receiptNo,
            reference,
            remarks,
            patient,
            items,
            renewDate,
            totalDeposit
        }], { session });

        await session.commitTransaction();
        session.endSession();

        res.json(issue[0]);

    } catch (err) {

        await session.abortTransaction();
        session.endSession();

        console.log(err);
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

        if (!issue) {
            throw new Error("Issue not found");
        }

        /* restore old stock */

        for (const i of issue.items) {

            await MedicalItem.findByIdAndUpdate(
                i.item,
                { $inc: { totalStock: i.qty } },
                { session }
            );

        }

        /* deduct new stock */

        for (const i of req.body.items) {

            const item = await MedicalItem.findById(i.item).session(session);

            if (!item) {
                throw new Error("Item not found");
            }

            if (item.totalStock < i.qty) {
                throw new Error(`Not enough stock for ${item.itemName}`);
            }

            await MedicalItem.findByIdAndUpdate(
                i.item,
                { $inc: { totalStock: -i.qty } },
                { session }
            );

        }

        issue.items = req.body.items;
        issue.remarks = req.body.remarks;
        issue.reference = req.body.reference;
        issue.renewDate = req.body.renewDate;

        // save manual / auto deposit from frontend
        issue.totalDeposit = req.body.totalDeposit;

        await issue.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.json(issue);

    } catch (err) {

        await session.abortTransaction();
        session.endSession();

        console.error(err);
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

        if (!issue) {
            throw new Error("Issue not found");
        }

        /* restore stock */

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

        console.error(err);
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
            .populate({
                path: "items.item",
                model: "MedicalItem"
            })
            .sort({ createdAt: -1 });

        res.json(issues);

    } catch (err) {

        console.error(err);
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
            .populate({
                path: "items.item",
                model: "MedicalItem"
            })
            .sort({ createdAt: -1 });

        res.json(issues);

    } catch (err) {

        console.error(err);
        res.status(500).json({ message: "Failed to fetch active issues" });

    }

});


/* ===============================
   RETURN ISSUE
================================= */

router.put("/return/:id", async (req, res) => {

    const session = await mongoose.startSession();
    session.startTransaction();

    try {

        const issue = await Issue.findById(req.params.id).session(session);

        if (!issue) {
            throw new Error("Issue not found");
        }

        if (issue.isReturned) {
            throw new Error("Item already returned");
        }

        /* restore stock */

        for (const i of issue.items) {

            await MedicalItem.findByIdAndUpdate(
                i.item,
                { $inc: { totalStock: i.qty } },
                { session }
            );

        }

        issue.isReturned = true;
        issue.returnedAt = new Date();

        await issue.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.json({
            message: "Item returned successfully",
            data: issue
        });

    } catch (err) {

        await session.abortTransaction();
        session.endSession();

        console.error(err);
        res.status(500).json({ message: err.message });

    }

});


module.exports = router;