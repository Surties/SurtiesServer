const NewsModel = require("./news.schema");
const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const JWT_SECERT = process.env.JWT_SECERT;
app.use(express.json());
const isEditor = async (req, res, next) => {
  try {
    const cookie = req.headers.cookie;
    if (!cookie) {
      res.status(404).json({ message: "No Cookie" });
    }
    const token = cookie.split("=")[1];

    if (!token) {
      res.status(401).json({ message: "Unauthorized: No token provided" });
    }
    const decoded = jwt.verify(token, JWT_SECERT);
    if (decoded.role !== "newsEditor" && decoded.role !== "admin") {
      res.status(403).json({
        message: "Forbidden: Only admin and news editor can access this route",
      });
    }
    req.user = decoded;
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

app.get("/", async (req, res) => {
  const q = req.query.search;
  const filter = req.query.filter;
  let page = parseInt(req.query.page) || 1;
  const skip = (page - 1) * 12;

  try {
    let query = {};
    if (filter) {
      query = { ...query, catagory: { $in: [filter] } };
    }

    if (q) {
      query = { ...query, heading: { $regex: new RegExp(q, "i") } };
    }

    const totalItems = await NewsModel.countDocuments(query);
    const totalPages = Math.ceil(totalItems / 9);

    const newsItems = await NewsModel.find(query)
      .skip(skip)
      .limit(9)
      .sort({ date: -1 });
    res.json({
      newsItems,
      totalPages,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
app.get("/topweek", async (req, res) => {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const result = await NewsModel.aggregate([
      { $match: { date: { $gte: oneWeekAgo } } },
      { $group: { _id: "$_id", totalClicks: { $sum: "$clicks" } } },
      { $sort: { totalClicks: -1 } },
    ]);
    const topPostIds = result.map((item) => item._id);
    const topPosts = await NewsModel.find({ _id: { $in: topPostIds } });

    res.json(topPosts);
  } catch (error) {
    console.error("Error fetching top posts:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
app.get("/grouped", async (req, res) => {
  try {
    const categories = await NewsModel.distinct("catagory", {});

    const groupedDocuments = await Promise.all(
      categories.map(async (category) => {
        const documents = await NewsModel.aggregate([
          { $match: { catagory: category } },
          { $sort: { date: -1 } }, // Sort by date in descending order
          { $group: { _id: "$_id", document: { $first: "$$ROOT" } } },
          { $replaceRoot: { newRoot: "$document" } },
          { $limit: 4 },
        ]);

        return { category, documents };
      })
    );

    res.send(groupedDocuments).status(200);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const newsItems = await NewsModel.findOne({ _id: id });
    res.json(newsItems);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/", async (req, res) => {
  const newNews = req.body;
  console.log(newNews);
  try {
    const news = new NewsModel(newNews);
    await news.save();
    res.status(201).json(news);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.patch("/:id", isEditor, async (req, res) => {
  const id = req.params.id;
  const data = req.body;
  try {
    const news = await NewsModel.findByIdAndUpdate(id, data);
    if (!news) {
      res.status(404).json({ message: "news not found" });
    }
    res.json({ message: "news has Been updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
app.patch("/topweek/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const news = await NewsModel.findByIdAndUpdate(id, { $inc: { clicks: 1 } });

    if (!news) {
      return res.status(404).json({ message: "News not found" });
    }
    res.json({ message: "News has been updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
app.delete("/:id", isEditor, async (req, res) => {
  const id = req.params.id;
  try {
    const news = await NewsModel.findByIdAndDelete(id);

    if (!news) {
      res.status(404).json({ message: "news not found" });
    }
    res.json({ message: "news deleted successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = app;
