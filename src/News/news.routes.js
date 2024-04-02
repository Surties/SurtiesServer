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
    const totalPages = Math.ceil(totalItems / 12);

    const newsItems = await NewsModel.find(query)
      .skip(skip)
      .limit(12)
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
    const oneWeekAgo = new Date() - 7 * 24 * 60 * 60 * 1000;

    const popularNews = await NewsModel.find({ time: { $gte: oneWeekAgo } })
      .sort({ clicks: -1 })
      .limit(4);

    res.json(popularNews);
  } catch (error) {
    res.status(500).json({ message: error.message });
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
app.get("/breaking-news", async (req, res) => {
  try {
    const breakingNews = await NewsModel.find({ breaking: true })
      .sort({ time: -1 })
      .limit(10);

    res.status(200).send(breakingNews);
  } catch (error) {
    console.error("Error fetching breaking news:", error);
    res.status(500).send({ message: "Something went wrong" });
  }
});
app.get("/slider", async (req, res) => {
  try {
    const slider = await NewsModel.find({ trending: true })
      .sort({ time: -1 })
      .limit(10);
    res.status(200).json(slider);
  } catch (error) {
    console.error("Error fetching slider:", error);
    res.status(500).send({ message: "Something went wrong" });
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
    const news = await NewsModel.findByIdAndUpdate(
      { _id: id },
      { $inc: { clicks: 1 } }
    );

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
    res.status(500).json({ message: err.message });
  }
});

module.exports = app;
