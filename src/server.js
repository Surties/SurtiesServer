const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const PORT = process.env.PORT;
const DB = process.env.DB;
const app = express();

const authRoutes = require("./Auth/auth.routes");
const careerRoutes = require("./Career/career.routes");
const newsRoutes = require("./News/news.routes");
const contact = require("./Contactus/contactus");
const sliderRoutes = require("./ImagesSlider/imageSlider.routes");
app.use(
  cors({
    credentials: true,
    origin: [
      "https://main--bucolic-brioche-b29257.netlify.app",
      "http://localhost:3000",
    ],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/auth", authRoutes);
app.use("/career", careerRoutes);
app.use("/news", newsRoutes);
app.use("/slider", sliderRoutes);
app.use("/contact-us", contact);
mongoose.connect(DB).then(() => {
  app.listen(PORT, () => {
    console.log(`server started on ${PORT}`);
  });
});
