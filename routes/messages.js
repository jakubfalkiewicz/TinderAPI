const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const Message = require("../models/Message");
const User = require("../models/User");

// Send message
router.post("/", async (req, res) => {
  try {
    const user1 = await User.findOne({ _id: req.body.from });
    const user2 = await User.findOne({ _id: req.body.to });
    if (user1 == null || user2 == null) {
      return res.status(400).send({ error: "One of users doesnt exist" });
    }
    const newMessage = new Message({
      from: mongoose.Types.ObjectId(req.body.from),
      to: mongoose.Types.ObjectId(req.body.to),
      message: req.body.message,
    });
    const message = await newMessage.save();
    res.json(message);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all messages
router.get("/", async (_req, res) => {
  try {
    const messages = await Message.find();
    res.json(messages);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get messages between two specific users
router.get("/:from/:to", async (req, res) => {
  try {
    const sent = await Message.find({
      from: req.params.from,
      to: req.params.to,
    });
    const received = await Message.find({
      from: req.params.to,
      to: req.params.from,
    });
    res.json({ sent: sent, received: received });
  } catch (err) {
    res.status(400).json({ error: err.message });
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
    res.status(400).json({ error: err.message });
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
    res.status(400).json({ error: err.message });
  }
});
module.exports = router;
