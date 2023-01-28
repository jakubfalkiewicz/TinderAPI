const express = require("express");
const router = express.Router();
const uuid = require("uuid");
const mongoose = require("mongoose");

const Message = require("../models/Message");

// Send message
router.post("/", async (req, res) => {
  try {
    const newMessage = new Message({
      from: mongoose.Types.ObjectId(req.body.from),
      to: mongoose.Types.ObjectId(req.body.to),
      message: req.body.message,
    });
    const message = await newMessage.save();
    res.json(message);
  } catch (err) {
    res.status(400).json({ error: err });
  }
});

// Get all messages
router.get("/", async (req, res) => {
  try {
    const messages = await Message.find();
    res.json(messages);
  } catch (err) {
    res.status(400).json({ error: err });
  }
});

// Get messages between two specific users
router.get("/:from/:to", async (req, res) => {
  try {
    const messages = await Message.find({
      from: req.params.from,
      to: req.params.to,
    });
    res.json(messages);
  } catch (err) {
    res.status(400).json({ error: err });
  }
});

// Update a message by ID
router.put("/:id", async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }
    await Message.updateOne({ _id: req.params.id }, req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err });
  }
});

// Delete a message by ID
router.delete("/:id", async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }
    await Message.deleteOne({ _id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err });
  }
});
module.exports = router;
