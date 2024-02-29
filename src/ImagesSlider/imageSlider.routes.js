const sliderModel = require("./imageSlider.schema");
const express = require("express");
const jwt = require("jsonwebtoken");
const app = express();
const JWT_SECERT = process.env.JWT_SECERT;

const isEditor = async (req, res, next) => {
  try {
    const cookie = req.headers.cookie;
    if (!cookie) {
      return res.status(404).json({ message: "No Cookie" });
    }
    const token = cookie.split("=")[1];

    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized: No token provided" });
    }
    const decoded = jwt.verify(token, JWT_SECERT);
    if (decoded.role !== "newsEditor" && decoded.role !== "admin") {
      return res.status(403).json({
        message: "Forbidden: Only admin and news editor can access this route",
      });
    }
    req.user = decoded;
    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};
app.get("/", async (req, res) => {
  try {
    const sliderItems = await sliderModel.find().sort({ date: -1 }).limit(7);
    res.json(sliderItems);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
app.post("/", isEditor, async (req, res) => {
  const newSlider = req.body;

  try {
    // Save the new slider item
    const slider = new sliderModel(newSlider);
    await slider.save();

    // Check if the total documents exceed 7
    const totalDocuments = await sliderModel.countDocuments();
    if (totalDocuments > 7) {
      // Find the oldest documents and delete them
      const oldestItems = await sliderModel
        .find()
        .sort({ date: 1 })
        .limit(totalDocuments - 7);
      const oldestIds = oldestItems.map((item) => item._id);
      await sliderModel.deleteMany({ _id: { $in: oldestIds } });
    }

    res.status(201).json(slider);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
module.exports = app;
