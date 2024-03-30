const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const PORT = process.env.PORT;
const DB = process.env.DB;
const app = express();
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));
const authRoutes = require("./Auth/auth.routes");
const careerRoutes = require("./Career/career.routes");
const newsRoutes = require("./News/news.routes");
const contact = require("./Contactus/contactus");

const emailList = require("./NewsSub/EmailList.routes");
app.use(
  cors({
    credentials: true,
    origin: ["https://surties.in", "http://localhost:3000"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/auth", authRoutes);
app.use("/career", careerRoutes);
app.use("/news", newsRoutes);

app.use("/contact-us", contact);
app.use("/email-list", emailList);
mongoose.connect(DB).then(() => {
  app.listen(PORT, () => {
    console.log(`server started on ${PORT}`);
  });
});
