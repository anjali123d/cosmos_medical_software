const express = require("express");
const router = express.Router();
const MedicalItem = require("../models/MedicalItem");

// Add Item
router.post("/", async (req, res) => {
    const item = await MedicalItem.create(req.body);
    res.json(item);
});

// Get Items
router.get("/", async (req, res) => {
    const items = await MedicalItem.find();
    res.json(items);
});

// Update Stock
router.put("/:id", async (req, res) => {
    const updated = await MedicalItem.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
    );
    res.json(updated);
});

module.exports = router;