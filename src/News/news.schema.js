const mongoose = require("mongoose");
const newsSchema = new mongoose.Schema({
  heading: String,
  subHeading: String,
  thumbnail: String,
  imgs: [String],
  author: String,
  date: { type: String, default: Date.now() },
  trending: String,
  numberOfClick: Number,
  catagory: [String],
  article: String,
});
const NewsModel = mongoose.model("news", newsSchema);
module.exports = NewsModel;
