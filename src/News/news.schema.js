const mongoose = require("mongoose");
const newsSchema = new mongoose.Schema({
  heading: String,
  subHeading: String,
  thumbnail: String,
  time: { type: String, default: Date.now() },
  imgs: [String],
  instaLink: String,
  twitterLink: String,
  breaking: Boolean,
  author: String,
  date: { type: String, default: new Date(Date.now()) },
  trending: Boolean,
  numberOfClick: Number,
  catagory: [String],
  article: String,
  clicks: { type: Number, default: 0 },
});
const NewsModel = mongoose.model("news", newsSchema);
module.exports = NewsModel;
