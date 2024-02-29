const mongoose = require("mongoose");
const careerSchema = new mongoose.Schema({
  file: String,
  name: String,
  email: String,
  phoneNumber: Number,
  postion: String,
});
const CareerModel = mongoose.model("career", careerSchema);
module.exports = CareerModel;
