const { Schema, model } = require("mongoose");
const bcrypt = require("bcryptjs");

// Define User model
const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    minLength: 6,
    maxLength: 30,
  },
  password: { type: String, required: true, minLength: 6, maxLength: 20 },
  name: { type: String, required: true, minLength: 3, maxLength: 20 },
  gender: {
    type: String,
    required: true,
    enum: ["male", "female"],
  },
  birthDate: {
    type: Date,
    required: true,
    min: "1900-01-01",
    max: "2004-01-01",
  },
  age: { type: Number },
  orientation: {
    type: String,
    required: true,
    enum: ["straight", "bisexual", "gay", "lesbian"],
  },
  description: { type: String, default: "" },
  interests: { type: [String], default: [] },
  zodiacSign: {
    type: String,
    enum: [
      "Aries",
      "Taurus",
      "Gemini",
      "Cancer",
      "Leo",
      "Virgo",
      "Libra",
      "Scorpio",
      "Sagittarius",
      "Capricorn",
      "Aquarius",
      "Pisces",
    ],
  },
  education: { type: String, default: "" },
  ageRangeFrom: { type: Number, default: 18, min: 18, max: 100 },
  ageRangeTo: { type: Number, default: 100, min: 18, max: 100 },
  address: [
    {
      lat: Number,
      lng: Number,
    },
  ],
  city: { type: String, default: "" },
  matches: {
    type: [{ type: Schema.Types.ObjectId, ref: "User" }],
    default: [],
  },
});

UserSchema.pre("save", function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = bcrypt.hashSync(this.password, 10);
  next();
});

UserSchema.methods.comparePassword = function (plaintext, callback) {
  return callback(null, bcrypt.compareSync(plaintext, this.password));
};

module.exports = model("User", UserSchema);
