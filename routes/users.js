const express = require("express");
const router = express.Router();

const User = require("../models/User");

// Create user
router.post("/", async (req, res) => {
  try {
    const newUser = new User({
      name: req.body.name,
      gender: req.body.gender,
      age: req.body.age,
      orientation: req.body.orientation,
      description: req.body.description,
      interests: req.body.interests,
      zodiacSign: req.body.zodiacSign,
      education: req.body.education,
      ageRangeFrom: req.body.ageRangeFrom,
      ageRangeTo: req.body.ageRangeTo,
      city: req.body.city,
      matches: req.body.matches,
    });
    const user = await newUser.save();
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err });
  }
});

// Get all users
router.get("/", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(400).json({ error: err });
  }
});

// Get specific user
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err });
  }
});

// Update a user by ID
router.put("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    await User.updateOne({ _id: req.params.id }, req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err });
  }
});

// Delete a user by ID
router.delete("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    await User.deleteOne({ _id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err });
  }
});
module.exports = router;
