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
// Delete Item
router.delete("/:id", async (req, res) => {
    try {
        const deletedItem = await MedicalItem.findByIdAndDelete(req.params.id);

        if (!deletedItem) {
            return res.status(404).json({ message: "Item not found" });
        }

        res.json({ message: "Item deleted successfully", deletedItem });
    } catch (error) {
        res.status(500).json({ message: "Error deleting item", error });
    }
});
router.get("/search/item", async (req, res) => {

    const q = req.query.q;

    const items = await MedicalItem.find({
        itemName: { $regex: q, $options: "i" }
    }).limit(10);

    res.json(items);

});
module.exports = router;