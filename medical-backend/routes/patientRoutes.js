const express = require("express");
const router = express.Router();
const Patient = require("../models/Patient");

// CREATE a patient
router.post("/", async (req, res) => {
    try {
        const patient = await Patient.create(req.body);
        res.json(patient);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// READ all patients
router.get("/", async (req, res) => {
    try {
        const patients = await Patient.find();
        res.json(patients);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// UPDATE a patient by ID
router.put("/:id", async (req, res) => {
    try {
        const patient = await Patient.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true } // return the updated document
        );
        if (!patient) {
            return res.status(404).json({ error: "Patient not found" });
        }
        res.json(patient);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE a patient by ID
router.delete("/:id", async (req, res) => {
    try {
        const patient = await Patient.findByIdAndDelete(req.params.id);
        if (!patient) {
            return res.status(404).json({ error: "Patient not found" });
        }
        res.json({ message: "Patient deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;