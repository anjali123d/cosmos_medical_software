const express = require("express");
const router = express.Router();
const Patient = require("../models/Patient");

router.post("/", async (req, res) => {
    const patient = await Patient.create(req.body);
    res.json(patient);
});

router.get("/", async (req, res) => {
    const patients = await Patient.find();
    res.json(patients);
});

module.exports = router;