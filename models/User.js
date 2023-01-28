const { Schema, model } = require("mongoose");

// Define User model
const UserSchema = new Schema({
  name: { type: String, required: true },
  gender: { type: String, required: true },
  age: { type: Number, required: true },
  orientation: { type: String, required: true },
  description: { type: String, default: "" },
  interests: { type: [String], default: [] },
  zodiacSign: { type: String, default: "" },
  education: { type: String, default: "" },
  ageRangeFrom: { type: Number, default: 18 },
  ageRangeTo: { type: Number, default: 100 },
  city: { type: String, default: "" },
  matches: { type: [String], default: [] },
});

module.exports = model("User", UserSchema);
