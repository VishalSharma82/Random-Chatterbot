// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String },
  gender: { type: String },
  friends: [{ type: String }] // store friend codes
});

module.exports = mongoose.model("User", userSchema);
