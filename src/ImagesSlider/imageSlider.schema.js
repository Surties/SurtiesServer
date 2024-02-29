const mongoose = require("mongoose");
const sliderSchema = new mongoose.Schema({
  img: String,
  heading: String,
  link: String,
  date: { type: String, default: Date.now() },
});
const sliderModel = mongoose.model("slider", sliderSchema);
module.exports = sliderModel;
