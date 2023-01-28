const { Schema, model } = require("mongoose");

// Define Message model
const MessageSchema = new Schema({
  from: { type: Schema.Types.ObjectId, ref: "User", required: true },
  to: { type: Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, default: Date.now },
  message: { type: String, required: true },
});

module.exports = model("Message", MessageSchema);
