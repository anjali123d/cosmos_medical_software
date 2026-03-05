const express = require("express");
const router = express.Router();

const Issue = require("../models/Issue");
const Patient = require("../models/Patient");
const MedicalItem = require("../models/MedicalItem");


/* ===============================
   CREATE NEW ISSUE
================================= */

router.post("/", async (req, res) => {
    try {

        const { receiptNo, reference, patient, items, totalDeposit } = req.body;

        const newIssue = new Issue({
            receiptNo,
            reference,
            patient,
            items,
            totalDeposit,
            isReturned: false
        });

        await newIssue.save();

        res.json({
            message: "Issue created successfully",
            data: newIssue
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to create issue" });
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
    try {

        const issue = await Issue.findById(req.params.id);

        if (!issue) {
            return res.status(404).json({ message: "Issue not found" });
        }

        issue.isReturned = true;
        issue.returnedAt = new Date();

        await issue.save();

        res.json({
            message: "Item returned successfully",
            data: issue
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Return failed" });
    }
});

module.exports = router;