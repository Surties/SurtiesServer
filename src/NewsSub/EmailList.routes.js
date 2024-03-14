const EmailList = require("./EmailList.schema");
const express = require("express");
const app = express();
app.get("/", async (req, res) => {
  try {
    const emailsList = await EmailList.find();
    res.status(200).send(emailsList);
  } catch (error) {
    res.status(404).send("something Went Wrong");
  }
});
app.post("/", async (req, res) => {
  const newEmail = req.body;
  try {
    const emailModel = new EmailList(newEmail);
    await emailModel.save();
    res.status(201).json({ message: "you are subscribed", email: newEmail });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
module.exports = app;
